---
name: mcp-selfhost
description: Use the user's verified private MCP Selfhost facade for Windows files, processes, PowerShell, WSL, Git, and development work without silently falling back to the hosted Remote Desktop Commander connector.
---

# MCP Selfhost

Use the `mcp-selfhost-local` MCP server for local-machine work.

## Identity gate

Before any machine inspection or action, call `mcp_selfhost_identity`.
The response must contain all of:

- `provider: pipijun-mcp-selfhost`
- `transport: self-hosted`
- `marker: SELFHOST_E2E_OK`
- `version: 0.2.0` or newer

If the identity tool is missing or the marker differs, stop and report that MCP Selfhost was not verified. Do not substitute an unprefixed Remote Desktop Commander tool.

## Tool namespace

Desktop Commander tools are intentionally renamed with the `selfhost_` prefix.
Examples: `selfhost_get_config`, `selfhost_read_file`, `selfhost_write_file`, and `selfhost_start_process`.

Never use similarly named unprefixed tools when this plugin is explicitly invoked.

## Preferred workflow

1. Verify identity with `mcp_selfhost_identity`.
2. Optionally call `mcp_selfhost_health` when transport status matters.
3. Prefer read-only inspection before edits or process changes.
4. Use only `selfhost_*` tools for Desktop Commander operations.
5. Keep commands scoped to the requested project or directory.
6. Report the identity marker plus concrete command output and changed paths.

## Local transport

The plugin connects to `http://127.0.0.1:18080/mcp`.
The facade talks to Desktop Commander locally over stdio and does not require the hosted Remote Desktop Commander relay.

## Safety and secrets

- Do not read SSH private keys, browser profiles, credential stores, password databases, `.env` secrets, or tokens unless explicitly requested and necessary.
- Do not change Desktop Commander security configuration as part of unrelated work.
- Treat destructive filesystem, service, firewall, account, disk, or boot changes as high-impact operations and require explicit user intent.
- Do not expose local MCP ports directly to the public network.
