# Overview

Bitcoin Node Hub is a web interface for monitoring and operating one or more Bitcoin nodes from your own infrastructure.

This site explains:

- What the app does.
- How data flows between the UI, API, and your nodes.
- How to configure node credentials and optional authentication.
- How to run workflows with or without Docker.

## Who these Docs are for

- All Bitcoin Node Operators running on private hardware.
- Bitcoin Miners, especially DATUM Gateway users.
- Bitcoiners using their Node's built-in wallet.
- Developers wanting to understand app behavior at a high level.
- Anyone evaluating whether the app fits their environment.

## Data Flow

Bitcoin Node Hub is a Nuxt application with a server-side API layer.

1. The browser UI requests data from the app API.
2. The app API calls each configured node over RPC.
3. The API normalizes and returns data to the UI for dashboard, peer, mempool, ban, and transaction views.

RPC between the app API and each node is done over HTTP, so network placement and access control matter. Read the security guide before exposing anything beyond your local/private network.

## Disclaimer

We strongly recommend using this application only in controlled environments  by advanced system administrators with expertise in network security. Start with a test node for initial validation.

Bitcoin Node Hub is intended for self-hosted/private hardware. Do not expose this app or node RPC interfaces directly to the public internet unless you have strong transport and network protections in place.

Use this software at your own risk. The developers and contributors are not liable for any damages, losses, or security issues arising from its use. Always exercise caution, thoroughly review the code, and your security plan before deployment. These docs are designed to help you with all of the above.

## 

# Features

## Dashboard

The dashboard shows per-node status metrics, including chain progress, sync state, network details, and basic health indicators.

![Bitcoin Node Hub Dashboard](https://i.imgur.com/PPF6n59.png)

## Peer Mapping

Peer mapping displays connection geography and peer details for each selected node. You can inspect peer state and perform moderation actions when enabled.

![Bitcoin Node Hub Peer Mapping](https://i.imgur.com/g6XCHXD.png)

## Mempool Visualizer

The mempool visualizer highlights transaction activity, fee pressure, and size/spam patterns so you can quickly understand node mempool conditions.

![Bitcoin Node Hub Mempool Visualizer](https://i.imgur.com/uN5lKwL.png)

## Transaction Lookup

Transaction lookup lets you query specific txids against configured nodes for quick verification and inspection.

## Ban Management

Ban management depends on node RPC permissions. If you want these features, explicitly allow ban-related methods in your node RPC whitelist.

## Read next

- Start with Getting Started for prerequisites and setup flow.
- Read Security before deploying.
- Use Docker Support for container commands.
