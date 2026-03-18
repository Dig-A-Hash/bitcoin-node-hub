# Installation

Clone this repo to your machine.

https://github.com/Dig-A-Hash/bitcoin-node-hub

## Prerequisites

- At least one reachable Bitcoin node ([Bitcoin Knots](https://bitcoinknots.org/) recommended).
- Node RPC credentials for each node you want to monitor.
- Network access from Bitcoin Node Hub to node RPC endpoints.
- [Node.js](https://nodejs.org/) and NPM are required on a host machine, otherwise use [Docker Desktop](https://www.docker.com/products/docker-desktop/).

## Install to Your Host Machine

First, use the CLI to change to the newly cloned directory and install the project dependencies using the Node Package Manager ([NPM](https://www.npmjs.com/)).

`npm install`

Next, create a production build, which will be generated in the .output directory.

`npm run build`

NUXT_BITCOIN_NODE_CREDENTIALS must be setup with credentials for each node to be monitored. Setup credentials to your nodes prior to running the server.

## Run Production Build

The command to run the app is simple.

`node .output/server/index.mjs`

However, there is one required environment variable for your node credentials that must be specified, and there is an option to specify a Port. See the details in the Configuration section next.

## Docker Support

Many people choose not to run Node.js or NPM on their host machine for security reasons. This is a good practice, and Docker support has been added to this project. Using Docker is the primary way this app is developed, and Docker is a fantastic option for running production builds too.

See the Docker Workflows section for more info.