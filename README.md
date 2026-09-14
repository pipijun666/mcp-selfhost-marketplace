# MCP Selfhost Marketplace

Public Codex plugin marketplace for the `mcp-selfhost` plugin.

The plugin connects Codex Desktop to a local MCP bridge at:

`http://127.0.0.1:18080/mcp`

The bridge must already be running on the same machine as Codex. This repository contains plugin metadata and operating instructions only; it does not expose a computer by itself.

## Layout

- `.agents/plugins/marketplace.json` — marketplace manifest
- `plugins/mcp-selfhost/.codex-plugin/plugin.json` — plugin manifest
- `plugins/mcp-selfhost/.mcp.json` — local MCP configuration
- `plugins/mcp-selfhost/skills/mcp-selfhost/SKILL.md` — operating instructions
- `plugins/mcp-selfhost/scripts/check-local.ps1` — Windows local health check

## Security

No credentials, tokens, private keys, or server secrets are stored in this repository. Keep port `18080` loopback-only; do not expose it directly to the public Internet.

## Add the marketplace in Codex

Use source `pipijun666/mcp-selfhost-marketplace`, Git ref `main`, and leave the sparse path empty.