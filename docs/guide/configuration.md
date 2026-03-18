# Configuration

The Bitcoin Node Hub must be configured prior to running. This page describes required and optional runtime configurations.

## Update `.env`

Create and edit the `.env` file in the project root before starting the app. The Bitcoin Node Hub ships with a `.env.example` file that can be copied, and renamed to '.env.'

This file will contain the secrets needed for the Bitcoin Node Hub to access your nodes. Do not store clear text passwords here.

Add or update `NUXT_BITCOIN_NODE_CREDENTIALS` with a valid JSON array string.

Example:

```bash
NUXT_BITCOIN_NODE_CREDENTIALS='[{"name":"Your-Node-1","user":"bitcoinrpc","password":"your-password-hash","host":"192.168.1.420","port":"8332"},{"name":"Your-Node-2","user":"bitcoinrpc","password":"your-password-hash","host":"192.168.1.69","port":"8332"}]'
```

## Use Environment Variables

You do not need to use a .env file. Optionally, you can also run with  environment variables set on your server:

```bash
PORT=3600 NUXT_BITCOIN_NODE_CREDENTIALS='[{"name":"Node-Runner-Exp","user":"bitcoinrpc","password":"your-password-hash","host":"192.168.1.420","port":"8332"},{"name":"Node-Runner","user":"bitcoinrpc","password":"your-password","host":"192.168.1.69","port":"8332"}]' node .output/server/index.mjs
```

```powershell
& {
    $env:PORT = "3600"
    $env:NUXT_BITCOIN_NODE_CREDENTIALS = '[{"name":"Node-Runner-Exp","user":"bitcoinrpc","password":"your-password-hash","host":"192.168.1.420","port":"8332"},{"name":"Node-Runner","user":"bitcoinrpc","password":"your-password","host":"192.168.1.69","port":"8332"}]'
    node .output/server/index.mjs
}
```

## Required Credential Schema

`NUXT_BITCOIN_NODE_CREDENTIALS` is required and must be valid JSON array.

Example:

```json
[
  {
    "name": "Your-Node-1",
    "user": "bitcoinrpc",
    "password": "your-password-hash",
    "host": "192.168.1.420",
    "port": "8332",
  },
  {
    "name": "Your-Node-2",
    "user": "bitcoinrpc",
    "password": "your-password-hash",
    "host": "192.168.1.69",
    "port": "8332",
  }
]
```

Field notes:

- `name`: label used in the UI.
- `user`: RPC username.
- `password`: RPC password.
- `host`: node host or IP.
- `port`: node RPC port.

## Optional runtime variables

- `PORT`: Bitcoin Node Hub listening port.
- `ADMIN_PASSWORD_HASH`: Enables a login screen in the Bitcoin Node Hub when set.
- `NUXT_SESSION_PASSWORD`: Required when auth is enabled; should be at least 32 characters.

For auth setup details (`ADMIN_PASSWORD_HASH`, `NUXT_SESSION_PASSWORD`, and session behavior), see `/guide/authentication`.

## Safety guidance

- Never use or commit plaintext credentials to source control.

