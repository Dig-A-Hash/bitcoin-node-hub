# Bitcoin Node Hub

Bitcoin Node Hub is used to monitor and view information about multiple Bitcoin nodes. This is particularly useful for managing low-power, headless nodes that lack a dedicated monitor. Key features include real-time blockchain info, connection details, and more.

### Dark Mode

![Bitcoin Node Hub](https://i.imgur.com/zSm1h5L.png)

### Light Mode

![Bitcoin Node Hub](https://i.imgur.com/RGYGHTY.png)

## Dependencies

This app requires [Node.js](https://nodejs.org/en), the latest version is always recommended. This app requires at least 1 Bitcoin Node. This app is only tested with [Bitcoin Knots](https://bitcoinknots.org/) because we do not want to see spam on the Bitcoin Network, but any Bitcoin Node should work.

## Installation

Install using the following command from the project root.

`npm run build`

Run the production build.

`PORT=3500 node .output/server/index.mjs`

## Dev Notes

VSCode sandboxing will not allow Node.js to call IPs that are on the local network. Either use start vsCode with no sandboxing, or start the app outside of VSCode in a terminal window.
