# Bitcoin Node Hub

Bitcoin Node Hub is used to monitor and view information about multiple Bitcoin nodes. This is particularly useful for managing low-power, headless nodes that lack a dedicated monitor. Key features include real-time blockchain info, connection details including a geographic map of peers, sync status, ban management, Mempool visualization, spam tacking, transaction querying and more.

## Documentation

[Visit the Bitcoin Node Hub Docs](https://bitcoin-node-hub-docs.dig-a-hash.com/)

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

## Disclaimer

We strongly recommend using this application only in controlled environments by advanced network administrators with expertise in network security.

Bitcoin Node Hub is intended for self-hosted/private hardware. Do not expose this app or node RPC interfaces directly to the public internet unless you have strong transport and network protections in place.

Use this software at your own risk. The developers and contributors are not liable for any damages, losses, or security issues arising from its use. Always exercise caution, thoroughly review the code, and your security plan before deployment.
