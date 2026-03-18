# Bitcoin Node Hub

Bitcoin Node Hub is used to monitor and view information about multiple Bitcoin nodes. This is particularly useful for managing low-power, headless nodes that lack a dedicated monitor. Key features include real-time blockchain info, connection details including a geographic map of peers, sync status, ban management, Mempool visualization, spam tacking, transaction querying and more.

## Documentation

Detailed public documentation is available in the VitePress docs site under `docs/`.

- Start here: `docs/guide/getting-started.md`
- Security posture: `docs/guide/security.md`
- Docker commands and support: `docs/guide/docker.md`
- Amplify deployment for docs site only: `docs/guide/deployment-amplify.md`

## Dashboard

The dashboard shows important status metrics for each node.
![Bitcoin Node Hub Dashboard](https://i.imgur.com/PPF6n59.png)

## Peer Mapping

Zoom in, navigate, and map, peer geographic locations. Ban peers from here as needed.
![Bitcoin Node Hub Peer Mapping](https://i.imgur.com/g6XCHXD.png)

## Mempool Visualizer

The mempool visualizer helps us understand what is in the mempool at a glance, or drill down into individual transactions. The spam, fees, and sizes of data in the mempool are also shown here.
![Bitcoin Node Hub Mempool Visualizer](https://i.imgur.com/uN5lKwL.png)

## Data Flow

This app runs a server-side API that will make clear text http calls to the bitcoin-cli running on a Bitcoin Node.

**Important**: Connecting to Bitcoin Nodes over the internet is very insecure due to making clear-text http API calls to each node. This will expose the credentials to your node unless you encrypt the traffic yourself. Bitcoin Nodes do not support SSL/TLS at the server. Therefore other forms of modern encryption for connecting to nodes securely, like:

- Stunnel or nginx as a reverse proxy to wrap RPC in TLS.
- SSH tunneling for secure access.
- Third-party tools like RPC over Tor.
- VPN

## Disclaimer (Beta Testing)

We strongly recommend using this application only in controlled testing environments with test nodes or by advanced web administrators with expertise in network security.

Bitcoin Node Hub is intended for self-hosted/private hardware. Do not expose this app or node RPC interfaces directly to the public internet unless you have strong transport and network protections in place.

Use this software at your own risk. The developers and contributors are not liable for any damages, losses, or security issues arising from its use. Always exercise caution, thoroughly review the code, and your security plan before deployment.

## Dependencies

This app requires [Node.js](https://nodejs.org/en), the latest version is always recommended. At least 1 Bitcoin Node is required. This app is only tested with [Bitcoin Knots](https://bitcoinknots.org/) for now, but any modern Bitcoin Node should work.

Docker is optional for deploying the app runtime, but this project ships with full Docker support for local development and operational workflows.

## Installation

Clone this repo.

First, use the CLI to change to the newly cloned directory and install the project dependencies using the Node Package Manager ([NPM](https://www.npmjs.com/)).

`npm install`

Next, use the CLI to change to the newly cloned directory, and pre-load the [GeoLite2](https://github.com/GitSquared/node-geolite2-redist) IP Address Geographic Location Data using the following command from the project root.

`npm run preload-geolite2`

Next, create a production build, which will be generated in the .output directory.

`npm run build`

NUXT_BITCOIN_NODE_CREDENTIALS must be setup with credentials for each node to be monitored. Setup credentials to your nodes prior to running the server.

## Run Production Build

The command to run the app is simple.

`node .output/server/index.mjs`

However, there is one required environment variable for your node credentials that must be specified, and there is an option to specify a Port.

```
PORT=3600 NUXT_BITCOIN_NODE_CREDENTIALS='[{"name":"Node-Runner-Exp","user":"bitcoinrpc","password":"your-password","host":"192.168.1.420","port":"8332"},{"name":"Node-Runner","user":"bitcoinrpc","password":"your-password","host":"192.168.1.69","port":"8332","protocol": "http"}]' node .output/server/index.mjs
```

The NUXT_BITCOIN_NODE_CREDENTIALS must be a valid JSON array.

```
[
  {
    "name":"Your-Node-1","user":"bitcoinrpc",
    "password":"your-password",
    "host":"192.168.1.420",
    "port":"8332",
    "protocol": "http"
  },
  {
    "name":"Your-Node-2",
    "user":"bitcoinrpc",
    "password":"your-password",
    "host":"192.168.1.69",
    "port":"8332",
    "protocol": "http"
  }
]
```

## Optional Admin Authentication

Authentication is optional and controlled only by `ADMIN_PASSWORD_HASH`.

- If `ADMIN_PASSWORD_HASH` is set, the app requires login for all routes except `/login`.
- If `ADMIN_PASSWORD_HASH` is empty or unset, authentication is disabled and the app is fully public.

When authentication is enabled, set a strong `NUXT_SESSION_PASSWORD` (at least 32 characters) to seal session cookies.

### Configure Session Lifetime

Session lifetime is configured in `runtimeConfig.session.maxAge` in `nuxt.config.ts`.

- Unit: seconds
- Current value: `60 * 60 * 24 * 30` (30 days)
- Behavior: with `maxAge` set, login sessions persist across browser restarts until expiration; without `maxAge`, sessions typically end when the browser session ends.

Example:

```ts
session: {
  password: process.env.NUXT_SESSION_PASSWORD || '',
  maxAge: 60 * 60 * 24 * 30,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
  },
},
```

To change duration, update the expression and restart the Docker dev environment so runtime config is reloaded.

### Update `.env`

Add or update these values in your `.env` file:

```bash
# Required for cookie session sealing when auth is enabled
NUXT_SESSION_PASSWORD=replace-with-at-least-32-characters

# Leave empty to disable auth, set to a hash to enable auth
ADMIN_PASSWORD_HASH=
```

How to apply this safely:

1. Open `.env` in your editor.
2. Add the two keys above if they are missing.
3. Keep `ADMIN_PASSWORD_HASH` empty to keep the app public.
4. Paste a generated hash into `ADMIN_PASSWORD_HASH` to require login.
5. Restart the Docker dev environment after changes so Nuxt reloads runtime config.

### Generate `ADMIN_PASSWORD_HASH`

Generate the hash from Docker so no plaintext password is stored in project files:

```bash
docker compose run --rm dev node -e 'import("@adonisjs/hash").then(async ({ Hash }) => { const { Scrypt } = await import("@adonisjs/hash/drivers/scrypt"); const password = process.argv[1]; if (!password) throw new Error("Pass password as the first argument."); const hash = new Hash(new Scrypt({})); console.log(await hash.make(password)); })' "replace-with-strong-password"
```

The command prints exactly one hash string. Use that full output as `ADMIN_PASSWORD_HASH`.

Example output:

```text
$scrypt$n=16384,r=8,p=1$j9m0D38OkncmqL86Y2bGeA$Y8g+CIY5A4obAnx3qKPvuUnGikugu9Kmq1W6XEiuqsc0y0oLAxlwaCyrI47nr2N32oHm5e50DFxxVQ7gBJSAVg
```

Set it like this (copy the entire line, including all `$` separators):

```bash
ADMIN_PASSWORD_HASH='$scrypt$n=16384,r=8,p=1$j9m0D38OkncmqL86Y2bGeA$Y8g+CIY5A4obAnx3qKPvuUnGikugu9Kmq1W6XEiuqsc0y0oLAxlwaCyrI47nr2N32oHm5e50DFxxVQ7gBJSAVg'
```

If your terminal wraps the output onto multiple visual lines, it is still a single hash value.

Set the generated output as `ADMIN_PASSWORD_HASH` in your environment configuration.

This follows the same security approach recommended for node RPC credentials: store only a hash, never a plaintext password.

## Node Config

Connecting to nodes requires specific settings in the Bitcoin configuration file on each node. For Bitcoin Node Hub, the safer approach is to use `rpcauth` with a dedicated read-only RPC user, bind only to the interfaces you actually need, and whitelist only the RPC methods required by the app.

Do not expose RPC on `0.0.0.0` unless you have a separate transport security layer in front of it. Prefer loopback plus the specific LAN IP that the node should listen on, and restrict `rpcallowip` to the exact host running Bitcoin Node Hub.

### Minimal Read-Only Permissions

The example below is the minimum read-only configuration for monitoring and viewing node data. It is appropriate when you want dashboard, peer, mempool, and transaction lookup access without granting administrative RPC permissions.

```
# Bitcoin Knots relay node configuration
listen=1
server=1

# Bind only to interfaces you actually need.
rpcbind=127.0.0.1
# Example: node LAN IP
rpcbind=192.168.1.420

# Allow only the Bitcoin Node Hub host.
# Example: Bitcoin Node Hub host IP
rpcallowip=192.168.1.69

# Dedicated read-only RPC user for Bitcoin Node Hub
rpcauth=bitcoin-node-hub:{SaltedPasswordHash}

# Allow only the RPC methods needed for read-only monitoring
rpcwhitelist=bitcoin-node-hub:getblock,getblockchaininfo,getblockcount,getblockhash,getrawtransaction,getindexinfo,getmemoryinfo,getmempoolentry,getmempoolinfo,getrawmempool,getdifficulty,getmininginfo,getnetworkinfo,getnettotals,getpeerinfo,uptime

# Deny anything not explicitly whitelisted
rpcwhitelistdefault=0

# Required if you want transaction lookup by txid
txindex=1

# If this node does not use wallet functionality, disable it
disablewallet=1
```

This profile is intentionally limited. It does not permit ban-management RPCs such as `setban`, `listbanned`, or `clearbanned`. If you want to use Bitcoin Node Hub ban-management features, add only those methods explicitly instead of widening access broadly.

If the node is not using wallet functionality, `disablewallet=1` reduces exposed attack surface and avoids loading wallet RPCs that Bitcoin Node Hub does not need for monitoring.

### Generate the Salted Password Hash

Bitcoin Core and Bitcoin Knots provide the `rpcauth.py` helper to generate the `rpcauth=` value. This produces the `salt$hash` portion used in `bitcoin.conf` and avoids storing a plaintext RPC password in the config file.

Download the helper from the upstream repository and run it with a dedicated username:

```
wget https://raw.githubusercontent.com/bitcoin/bitcoin/master/share/rpcauth/rpcauth.py
python3 rpcauth.py bitcoin-node-hub
```

The script prints two important values:

- `String to be appended to bitcoin.conf:` followed by a full `rpcauth=...` line.
- `Your password:` followed by the cleartext password that Bitcoin Node Hub should use in `NUXT_BITCOIN_NODE_CREDENTIALS`.

Example output:

```
String to be appended to bitcoin.conf:
rpcauth=bitcoin-node-hub:3c6b5d7d4f8a1a2b$7d2d3c4b5a6f...
Your password:
uS7rYp9Kq2LmN4xV
```

In that example:

- The full `rpcauth=bitcoin-node-hub:3c6b5d7d4f8a1a2b$7d2d3c4b5a6f...` line goes into `bitcoin.conf`.
- The generated password `uS7rYp9Kq2LmN4xV` is the password Bitcoin Node Hub uses when connecting to that node.

If you prefer to provide your own password instead of having the script generate one, pass it as the second argument:

```
python3 rpcauth.py bitcoin-node-hub your-strong-rpc-password
```

Use a unique RPC account for Bitcoin Node Hub, keep its method whitelist narrow, and rotate the password if you suspect it has been exposed.

## Developer Notes

Start the dev server in a new terminal window using.

`npm run dev`

## Docker Support

Install Docker Desktop, get it running then install the app using docker.

Docker is not required for every deployment model, but it is fully supported and is the standard local workflow in this repository.

### Install NPM Packages using Docker

```
docker run --rm -it -v "$(pwd):/app" -w /app node:24-slim \
  npm install
```

### Builds (or rebuilds) the Docker Image(s) in the Dockerfile
```
docker compose up --build
```

### Start the Container
```
docker compose up
```

### RPC Test Using CURL
This is good for debugging.
```
curl -v --user {USERNAME}:{PASSWORD} \
--data-binary '{"jsonrpc":"1.0","id":"test","method":"uptime","params":[]}' \
-H 'content-type: text/plain;' {HOST_URL}
```

## Package List

### Base Framework

- [Axios](https://github.com/axios/axios)
- [destr](https://github.com/unjs/destr)
- [iconify](https://github.com/iconify/icon-sets)
- [Nuxt](https://github.com/nuxt/nuxt)
- [Nuxt Auth Utils](https://github.com/atinux/nuxt-auth-utils)
- [Nuxt UI](https://github.com/nuxt/ui)
- [Pinia](https://github.com/vuejs/pinia)
- [pinia-persisted-state](https://codeberg.org/praz/pinia-plugin-persistedstate/)
- [TypeScript](https://github.com/microsoft/TypeScript)
- [vue](https://github.com/vuejs/core)
- [vue-router](https://github.com/vuejs/router)
- [zod](https://github.com/colinhacks/zod)

### Mapping

- [MaxMind GeoIP2 Node.js API](https://github.com/maxmind/GeoIP2-node)
- [node-geolite2-redist](https://github.com/GitSquared/node-geolite2-redist)
- [OpenLayers (ol)](https://github.com/openlayers/openlayers)
