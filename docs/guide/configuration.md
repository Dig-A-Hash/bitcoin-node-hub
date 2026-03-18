# Configuration

This page describes required and optional runtime configuration for Bitcoin Node Hub.

## Update `.env` first

Edit the `.env` file in the project root before starting the app.

Add or update `NUXT_BITCOIN_NODE_CREDENTIALS` with a valid JSON array string.

Example:

```bash
NUXT_BITCOIN_NODE_CREDENTIALS='[{"name":"Your-Node-1","user":"bitcoinrpc","password":"your-password","host":"192.168.1.420","port":"8332","protocol":"http"},{"name":"Your-Node-2","user":"bitcoinrpc","password":"your-password","host":"192.168.1.69","port":"8332","protocol":"http"}]'
```

Recommended update flow:

1. Open `.env`.
2. Add `NUXT_BITCOIN_NODE_CREDENTIALS` if it is missing.
3. Replace node values (`name`, `user`, `password`, `host`, `port`, `protocol`) with your real node data.
4. Keep the value as valid JSON.
5. Restart the Docker dev environment so Nuxt reloads runtime config.

## Required runtime variable

`NUXT_BITCOIN_NODE_CREDENTIALS` is required and must be valid JSON.

Example:

```json
[
  {
    "name": "Your-Node-1",
    "user": "bitcoinrpc",
    "password": "your-password",
    "host": "192.168.1.420",
    "port": "8332",
    "protocol": "http"
  },
  {
    "name": "Your-Node-2",
    "user": "bitcoinrpc",
    "password": "your-password",
    "host": "192.168.1.69",
    "port": "8332",
    "protocol": "http"
  }
]
```

Field notes:

- `name`: label used in the UI.
- `user`: RPC username.
- `password`: RPC password.
- `host`: node host or IP.
- `port`: node RPC port.
- `protocol`: usually `http` unless you have secured transport in front.

## Optional runtime variables

- `PORT`: app listening port.
- `ADMIN_PASSWORD_HASH`: enables app login when set.
- `NUXT_SESSION_PASSWORD`: required when auth is enabled; should be at least 32 characters.

## Runtime example

You can also run with inline environment variables:

```bash
PORT=3600 NUXT_BITCOIN_NODE_CREDENTIALS='[{"name":"Node-Runner-Exp","user":"bitcoinrpc","password":"your-password","host":"192.168.1.420","port":"8332"},{"name":"Node-Runner","user":"bitcoinrpc","password":"your-password","host":"192.168.1.69","port":"8332","protocol":"http"}]' node .output/server/index.mjs
```

The `NUXT_BITCOIN_NODE_CREDENTIALS` value must be a valid JSON array.

For auth setup details (`ADMIN_PASSWORD_HASH`, `NUXT_SESSION_PASSWORD`, and session behavior), see `/guide/authentication`.

## Safety guidance

- Never commit plaintext credentials.
- Keep node RPC users dedicated and narrowly permissioned.
- Restrict network access to trusted hosts only.

## Related docs

- `/guide/bitcoin-node-setup`
- `/guide/security`
- `/guide/docker`
