# MCP Selfhost Runtime

This directory contains the public, credential-free runtime used by MCP Selfhost v0.2.

It wraps `@wonderwhy-er/desktop-commander` over stdio and exposes a Streamable HTTP MCP facade on `127.0.0.1:18080`.

When a WSL virtual adapter is present, it also binds port `18081` only on that adapter so a private reverse SSH tunnel can reach the same verified facade.

## Verification tools

- `mcp_selfhost_identity` returns `SELFHOST_E2E_OK`.
- `mcp_selfhost_health` checks the facade and Desktop Commander upstream.
- Desktop Commander tools are renamed to `selfhost_*`.

This namespace is intentional: a client can distinguish MCP Selfhost from a separately installed hosted Remote Desktop Commander connector.

## Run

```powershell
npm install
npm start
```

Then check:

```powershell
Invoke-RestMethod http://127.0.0.1:18080/healthz
```

Do not expose ports 18080 or 18081 directly to the public Internet.
