# Overview

Bitcoin Node Hub is a web interface for monitoring and operating one or more Bitcoin nodes from your own infrastructure.

This site explains:

- what the app does,
- how data flows between the UI, API, and your nodes,
- how to configure node credentials and optional authentication,
- and how to run workflows with or without Docker.

## How Bitcoin Node Hub works

Bitcoin Node Hub is a Nuxt application with a server-side API layer.

1. The browser UI requests data from the app API.
2. The app API calls each configured node over RPC.
3. The API normalizes and returns data to the UI for dashboard, peer, mempool, ban, and transaction views.

RPC between the app API and each node is typically HTTP, so network placement and access control matter. Read the security guide before exposing anything beyond your local/private network.

## Who these docs are for

- Operators running Bitcoin Node Hub on private hardware.
- Developers wanting to understand app behavior at a high level.
- Anyone evaluating whether the app deployment model fits their environment.

## Read next

- Start with Getting Started for prerequisites and setup flow.
- Read Security before deploying.
- Use Docker Support for container commands.
- Use Amplify Docs Deploy only when publishing this docs site.
