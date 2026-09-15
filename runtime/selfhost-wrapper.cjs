const os = require('node:os');
const path = require('node:path');
const express = require('express');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const {
  ListToolsRequestSchema, ListToolsResultSchema,
  CallToolRequestSchema, CallToolResultSchema
} = require('@modelcontextprotocol/sdk/types.js');

const VERSION = '0.2.0';
const MARKER = 'SELFHOST_E2E_OK';
const PREFIX = 'selfhost_';
const PROJECT = __dirname;
const DC_ENTRY = path.join(PROJECT, 'node_modules', '@wonderwhy-er', 'desktop-commander', 'dist', 'index.js');
let upstreamClient = null;
let upstreamTransport = null;
let connecting = null;

function log(message) {
  process.stdout.write(`${new Date().toISOString()} ${message}\n`);
}
async function connectUpstream() {
  if (upstreamClient) return upstreamClient;
  if (connecting) return connecting;
  connecting = (async () => {
    const client = new Client({ name: 'mcp-selfhost-wrapper', version: VERSION }, { capabilities: {} });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [DC_ENTRY],
      cwd: PROJECT,
      stderr: 'pipe'
    });
    if (transport.stderr) {
      transport.stderr.on('data', chunk => log(`[desktop-commander] ${String(chunk).trimEnd()}`));
    }
    transport.onclose = () => {
      log('desktop-commander stdio closed');
      upstreamClient = null;
      upstreamTransport = null;
    };
    await client.connect(transport);
    upstreamClient = client;
    upstreamTransport = transport;
    log(`connected to desktop-commander pid=${transport.pid ?? 'unknown'}`);
    return client;
  })();
  try { return await connecting; } finally { connecting = null; }
}
function identityData(extra = {}) {
  return {
    provider: 'pipijun-mcp-selfhost',
    transport: 'self-hosted',
    marker: MARKER,
    version: VERSION,
    host: os.hostname(),
    timestamp: new Date().toISOString(),
    ...extra
  };
}

function identityResult(extra = {}) {
  return {
    content: [{ type: 'text', text: JSON.stringify(identityData(extra), null, 2) }],
    structuredContent: identityData(extra)
  };
}

function findWslAddress() {
  for (const [name, entries] of Object.entries(os.networkInterfaces())) {
    if (!/WSL/i.test(name)) continue;
    const hit = (entries || []).find(e => e.family === 'IPv4' && !e.internal);
    if (hit) return hit.address;
  }
  return null;
}
function createFacadeServer() {
  const server = new Server(
    { name: 'mcp-selfhost', version: VERSION },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async request => {
    const client = await connectUpstream();
    const upstream = await client.request(
      { method: 'tools/list', params: request.params || {} },
      ListToolsResultSchema
    );
    const tools = [
      {
        name: 'mcp_selfhost_identity',
        description: 'Proves this request is using the private MCP Selfhost path, not the hosted Remote Desktop Commander connector.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false }
      },
      {
        name: 'mcp_selfhost_health',
        description: 'Checks the self-hosted MCP facade and its local Desktop Commander upstream.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false }
      },
      ...upstream.tools.map(tool => ({
        ...tool,
        name: `${PREFIX}${tool.name}`,
        description: `[MCP Selfhost] ${tool.description || tool.name}`
      }))
    ];
    return { ...upstream, tools };
  });
  server.setRequestHandler(CallToolRequestSchema, async request => {
    const { name } = request.params;
    if (name === 'mcp_selfhost_identity') return identityResult();
    if (name === 'mcp_selfhost_health') {
      const client = await connectUpstream();
      const listed = await client.request({ method: 'tools/list', params: {} }, ListToolsResultSchema);
      return identityResult({ status: 'ok', upstream: 'desktop-commander', upstreamToolCount: listed.tools.length });
    }
    if (!name.startsWith(PREFIX)) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Unknown self-hosted tool: ${name}` }]
      };
    }
    const client = await connectUpstream();
    const params = { ...request.params, name: name.slice(PREFIX.length) };
    return client.request({ method: 'tools/call', params }, CallToolResultSchema);
  });

  return server;
}

const app = express();
app.use(express.json({ limit: '10mb' }));
app.get('/healthz', async (_req, res) => {
  try {
    const client = await connectUpstream();
    const listed = await client.request({ method: 'tools/list', params: {} }, ListToolsResultSchema);
    res.json(identityData({ status: 'ok', upstreamToolCount: listed.tools.length }));
  } catch (error) {
    res.status(503).json(identityData({ status: 'error', error: String(error) }));
  }
});
app.post('/mcp', async (req, res) => {
  const server = createFacadeServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    log(`request failed: ${error?.stack || error}`);
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
    }
  } finally {
    res.on('close', async () => {
      try { await transport.close(); } catch {}
      try { await server.close(); } catch {}
    });
  }
});

app.get('/mcp', (_req, res) => res.status(405).json({ error: 'Use MCP Streamable HTTP POST' }));
app.delete('/mcp', (_req, res) => res.status(405).json({ error: 'Stateless MCP endpoint' }));

const listeners = [];
function listen(host, port) {
  const s = app.listen(port, host, () => log(`listening http://${host}:${port}/mcp`));
  s.on('error', error => log(`listen ${host}:${port} failed: ${error.message}`));
  listeners.push(s);
}

listen('127.0.0.1', 18080);
const wslAddress = findWslAddress();
if (wslAddress) listen(wslAddress, 18081);
else log('WSL virtual adapter IPv4 not found; remote tunnel listener not started');
