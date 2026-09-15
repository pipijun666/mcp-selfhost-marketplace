# MCP Selfhost Marketplace

Public Codex plugin marketplace for the user's private `mcp-selfhost` runtime.

The repository publishes plugin metadata only. It contains no credentials and does not expose the user's computer. The runtime endpoint remains local:

`http://127.0.0.1:18080/mcp`

## v0.2 verification

Version 0.2 adds an explicit identity gate so it cannot be confused with the hosted Remote Desktop Commander connector.

Call:

`mcp_selfhost_identity`

Expected marker:

`SELFHOST_E2E_OK`

Desktop Commander tools are exposed only with a `selfhost_` prefix, for example `selfhost_get_config` and `selfhost_start_process`.

## Layout

- `.agents/plugins/marketplace.json` — marketplace manifest
- `plugins/mcp-selfhost/.codex-plugin/plugin.json` — plugin manifest
- `plugins/mcp-selfhost/.mcp.json` — local MCP endpoint
- `plugins/mcp-selfhost/skills/mcp-selfhost/SKILL.md` — identity-first operating instructions
- `plugins/mcp-selfhost/scripts/check-local.ps1` — local identity/health check

## Security

The MCP endpoint is loopback-only for local clients. The separate self-hosted VPS transport uses a private reverse SSH tunnel and is not configured in this public repository.

Do not expose port 18080 or 18081 directly to the public Internet.

## Import in Codex

Add this repository as a plugin marketplace:

- Source: `https://github.com/pipijun666/mcp-selfhost-marketplace.git`
- Git ref: `main`
- Sparse path: leave empty

After updating the plugin, reinstall/refresh it and start a new thread so the new MCP tool namespace is loaded.
