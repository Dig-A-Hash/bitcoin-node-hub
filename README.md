# Bitcoin Node Hub

Bitcoin Node Hub is used to monitor and view information about multiple Bitcoin nodes. This is particularly useful for managing low-power, headless nodes that lack a dedicated monitor. Key features include real-time blockchain info, connection details including a geographic map of peers, sync status, ban management, Mempool visualization, spam tacking, transaction querying and more.

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

Use this software at your own risk. The developers and contributors are not liable for any damages, losses, or security issues arising from its use. Always exercise caution, thoroughly review the code, and your security plan before deployment.

## Dependencies

This app requires [Node.js](https://nodejs.org/en), the latest version is always recommended. At least 1 Bitcoin Node is required. This app is only tested with [Bitcoin Knots](https://bitcoinknots.org/) for now, but any modern Bitcoin Node should work.

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
