# Getting Started

Bitcoin Node Hub helps you monitor and operate one or more Bitcoin nodes from a single web interface.

## Audience and deployment model

- This app is designed for self-hosted, private infrastructure.
- Public internet exposure is strongly discouraged without advanced networking.
- Docker is optional for app deployment, and fully supported by this project.

## Prerequisites

- At least one reachable Bitcoin node (Bitcoin Knots recommended).
- Node RPC credentials for each node you want to monitor.
- Network access from Bitcoin Node Hub to node RPC endpoints.

For contributor and maintainer local workflows in this repository, use Docker commands.

## Quick path through these docs

1. Read `/guide/overview` to understand app behavior.
2. Read `/guide/security` before deployment.
3. Configure nodes using `/guide/bitcoin-node-setup`.
4. Configure app credentials using `/guide/configuration`.
5. Use `/guide/docker` for containerized commands.
6. Use `/guide/deployment-amplify` only when publishing the docs site.

## Feature areas

- Dashboard status and node health.
- Peer mapping and peer details.
- Mempool visualization and transaction lookup.
- Optional ban management and optional admin authentication.
