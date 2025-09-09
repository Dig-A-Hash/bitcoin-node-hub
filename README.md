# Bitcoin Node Hub

Bitcoin Node Hub is used to monitor and view information about multiple Bitcoin nodes. This is particularly useful for managing low-power, headless nodes that lack a dedicated monitor. Key features include real-time blockchain info, connection details, and more.

## Dark Mode

The dashboard shows important metrics for each node.
![Bitcoin Node Hub](https://i.imgur.com/AdkTv08.png)

## Light Mode

The same dashboard in light mode.
![Bitcoin Node Hub](https://i.imgur.com/PGICM9n.png)

## Peer Mapping

Zoom in, navigate, and map peer geographic locations.
![Bitcoin Node Hub](https://i.imgur.com/AMYf2LE.png)

## Disclaimer (Beta Testing)

We strongly recommend using this application only in controlled testing environments with test nodes or by advanced web administrators with expertise in network security.

Important: Connecting to Bitcoin Nodes over the internet is not recommended at this time due to unresolved security vulnerabilities. The application is currently being tested exclusively in highly controlled local network environments with test nodes.

Use this software at your own risk. The developers and contributors are not liable for any damages, losses, or security issues arising from its use. Always exercise caution and thoroughly review the code before deployment.

## Dependencies

This app requires [Node.js](https://nodejs.org/en), the latest version is always recommended. This app requires at least 1 Bitcoin Node. This app is only tested with [Bitcoin Knots](https://bitcoinknots.org/) because we do not want to see spam on the Bitcoin Network, but any Bitcoin Node should work.

## Installation

First, pre-load the [GeoLite2](https://github.com/GitSquared/node-geolite2-redist) IP Address Geographic Location Dta using the following command from the project root.

`npm run preload-geolite2`

Create a production build in the .output directory.

`npm run build`

Run the production build, by setting the desired port. NUXT_BITCOIN_NODE_CREDENTIALS must be setup with credentials for each node to be monitored. Setup both prior to running node `.output/server/index.mjs`.

## Run Production Build

`PORT=3600 export NUXT_BITCOIN_NODE_CREDENTIALS='[{"name":"Node-Runner-Exp","user":"bitcoinrpc","password":"your-password","host":"192.168.1.420","port":"8332"},{"name":"Node-Runner","user":"bitcoinrpc","password":"your-password","host":"192.168.1.69","port":"8332"}]' node .output/server/index.mjs`

## Developer Notes

Start the dev server in a new terminal window using...

`npm run dev`

VSCode sandboxing will not allow Node.js to call IPs that are on the local network. Either use start vsCode with no sandboxing, or start the app outside of VSCode in a terminal window.
