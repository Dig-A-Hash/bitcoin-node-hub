# Bitcoin Node Hub

Bitcoin Node Hub is used to monitor and view information about multiple Bitcoin nodes. This is particularly useful for managing low-power, headless nodes that lack a dedicated monitor. Key features include real-time blockchain info, connection details including a detailed global map of peers, sync status, transaction querying and more.

## Dashboard

The dashboard shows important metrics for each node.
![Bitcoin Node Hub](https://i.imgur.com/AdkTv08.png)

## Peer Mapping

Zoom in, navigate, and map peer geographic locations.
![Bitcoin Node Hub](https://i.imgur.com/AMYf2LE.png)

## Data Flow

This app runs an API that will make clear text http calls to the bitcoin-cli running on a Bitcoin Node.

Important: Connecting to Bitcoin Nodes over the internet is very insecure due to making clear-text http API calls to each node. Consider modern encryption for connecting to nodes securely over the internet, like:

- Stunnel or nginx as a reverse proxy to wrap RPC in TLS.
- SSH tunneling for secure local access.
- Third-party tools like RPC over Tor.

## Disclaimer (Beta Testing)

We strongly recommend using this application only in controlled testing environments with test nodes or by advanced web administrators with expertise in network security.

Use this software at your own risk. The developers and contributors are not liable for any damages, losses, or security issues arising from its use. Always exercise caution, thoroughly review the code, and your security plan before deployment.

## Dependencies

This app requires [Node.js](https://nodejs.org/en), the latest version is always recommended. This app requires at least 1 Bitcoin Node. This app is only tested with [Bitcoin Knots](https://bitcoinknots.org/) because we do not want to see spam on the Bitcoin Network, but any Bitcoin Node should work.

## Installation

Clone this repo.

First, use the CLI to change to the newly cloned directory, and pre-load the [GeoLite2](https://github.com/GitSquared/node-geolite2-redist) IP Address Geographic Location Data using the following command from the project root.

`npm run preload-geolite2`

Next, create a production build, which will be generated in the .output directory.

`npm run build`

Run the production build, by setting the desired port. NUXT_BITCOIN_NODE_CREDENTIALS must be setup with credentials for each node to be monitored. Setup both prior to running node `.output/server/index.mjs`.

## Run Production Build

The command to run the app is simple.

`node .output/server/index.mjs`

However, there is one required environment variable for your node credentials that must be specified, and there is an option to specify a Port.

```
PORT=3600 NUXT_BITCOIN_NODE_CREDENTIALS='[{"name":"Node-Runner-Exp","user":"bitcoinrpc","password":"your-password","host":"192.168.1.420","port":"8332"},{"name":"Node-Runner","user":"bitcoinrpc","password":"your-password","host":"192.168.1.69","port":"8332"}]' node .output/server/index.mjs
```

The NUXT_BITCOIN_NODE_CREDENTIALS must be a valid JSON array.

```
[
  {
    "name":"Node-Runner-Exp","user":"bitcoinrpc",
    "password":"your-password",
    "host":"192.168.1.420",
    "port":"8332"
  },
  {
    "name":"Node-Runner",
    "user":"bitcoinrpc",
    "password":"your-password",
    "host":"192.168.1.69",
    "port":"8332"
  }
]
```

## Node Config

Connecting to nodes requires specific settings in the Bitcoin Configuration file on each node. Set the `rpcuser` and `rpcpassword` used by the API to access the Bitcoin CLI on the node.

`rpcbind` must be configured to listen on all IPs by using 0.0.0.0.

In turn, `rpcallowip` should specify the ip address of the allowed IP/range to control access. This should be the IP running the Bitcoin Node Hub.

```
server=1
rpcuser=bitcoinrpc
rpcpassword=your-password
rpcport=8332
rpcbind=0.0.0.0
rpcallowip=192.168.1.666/32
```

`txindex=1` must be set in the bitcoin config, in order to search for transactions.

## Developer Notes

Start the dev server in a new terminal window using.

`npm run dev`
