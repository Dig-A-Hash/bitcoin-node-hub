# Quick Facts

This page condenses key sections of the Maintainers Playbook into a quick technical reference for auditing the source code.

## Quick Project Facts

- Base Framework: [Nuxt](https://nuxt.com/) 4 + [Vue](https://vuejs.org/) 3 + [TypeScript](https://www.typescriptlang.org/).
- UI: [@nuxt/ui](https://ui.nuxt.com/) components.
- State: [Pinia](https://pinia.vuejs.org/) (+ [pinia-plugin-persistedstate](https://prazdevs.github.io/pinia-plugin-persistedstate/) for settings).
- Rendering mode: client-side (`ssr: false`).
- Dev server port: `3500` (from `nuxt.config.ts`).
- Main runtime dependency: Bitcoin JSON-RPC via HTTP Basic auth.

## High-Level Architecture

Frontend layout and routes:
- App boot: `app/app.vue` calls `bitcoinStore.fetchNodeNames()` on mount.
- Main layout: `app/layouts/default.vue` builds dynamic nav from node list.
- Pages:
  - `app/pages/index.vue` -> dashboard cards and combined totals
  - `app/pages/system/[i].vue` -> detailed node info
  - `app/pages/mempool/[i].vue` -> mempool summary + visualizer
  - `app/pages/peers/[i].vue` -> peer table + map + geo lookup
  - `app/pages/ban/[i].vue` -> ban list and removal
  - `app/pages/settings.vue` -> polling intervals persisted to localStorage

Backend API pattern:
- Thin [Nuxt](https://nuxt.com/) server endpoints in `server/api/**`.
- Each endpoint validates input with [Zod](https://zod.dev/) and/or shared schema.
- Node RPC access through `server/utils/bitcoinRpcClient.ts`.
- Errors normalized by `sendErrorResponse` in `server/utils/errors.ts`.

## Data Flow 

1. `app/app.vue` loads node names (`/api/getNodeNames`).
2. Sidebar/menu renders from `bitcoinStore.nodeNames`.
3. Dashboard (`index.vue`) polls `/api/getDashboard` per node.
4. Dashboard updates each node's `isIbd` state in the store.
5. Menu and polling behavior respond to `isIbd`:
   - IBD nodes are marked/limited in nav.
   - IBD nodes are polled on a slower interval.
6. Node-specific pages use route param `[i]` as `nodeIndex` for API calls.

## Store Responsibilities

`app/stores/bitcoin.ts`
- `nodeNames`: source of truth for node list and status (`isError`, `isIbd`).
- `nodeCount`: derived from fetched node names.
- `cachedNodes`: dashboard cache used for IBD nodes.

`app/stores/appSettings.ts`
- Poll intervals for dashboard/mempool.
- Persisted to localStorage via [pinia-plugin-persistedstate](https://prazdevs.github.io/pinia-plugin-persistedstate/).

## API Surface Map

Core endpoints:
- `GET /api/getNodeNames`
- `POST /api/getDashboard` body: `{ nodeIndex }`
- `POST /api/getNodeInfo` body: `{ nodeIndex }`
- `GET /api/getPeerInfo?nodeIndex=...`
- `GET /api/getTransaction?nodeIndex=...&txid=...`
- `POST /api/getVisualizer` body: `{ nodeIndex }`

Ban endpoints:
- `GET /api/ban/listBanned?nodeIndex=...`
- `POST /api/ban/setBan` body: `{ nodeIndex, ipAddress, banTime }`
- `POST /api/ban/removeBan` body: `{ nodeIndex, ipAddress }`
- `POST /api/ban/clearBanned` body: `{ nodeIndex }`

Geo endpoints:
- `GET /api/geoip/:ip`
- `POST /api/geoip/batch` body: `{ ips: string[] }`

## Mempool Visualizer Notes

The visualizer endpoint (`/api/getVisualizer`) is performance-sensitive and uses in-memory caches:
- `mempoolCache`: per node and block height
- `categoriesCache`: categorized tx groups
- `blocksCache`: recent blocks

Behavior:
- Cold start/new block: fetch full verbose mempool.
- Warm updates: fetch txid list, then batch fetch only new tx entries.
- High-priority txs are sorted by fee rate and trimmed to `MAX_VIZ_TX`.

If editing this path, preserve cache invalidation logic by block height.

## Validation and Error Contract

Shared base schema:
- `AppConstants.BASE_VALIDATION_SCHEMA` enforces `nodeIndex` in [0, 32].

Error utility:
- Zod errors -> HTTP 400 with readable field messages.
- `StatusError` supports explicit HTTP status mapping.
- Unknown errors -> generic `success: false` error payload.

Rule of thumb:
- Keep API responses in `ApiResponse<T>` shape.
- Prefer throwing `StatusError` for predictable client behavior.
