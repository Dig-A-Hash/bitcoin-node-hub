# Bitcoin Node Hub Maintainers Playbook

Purpose: this document is a fast, practical reference for maintaining and extending this app without touching the user-facing README.

## Maintainer Policy (Owner Preference)

- Local development must be Docker-only.
- Do not run Node.js or npm directly on the host machine.
- Use containerized commands from README Docker Support as the source of truth.
- Never read local .env files because they contain secrets.
- If environment structure is needed, use README documentation for schema.

## 1) Quick Project Facts

- Framework: Nuxt 4 + Vue 3 + TypeScript.
- UI: @nuxt/ui components.
- State: Pinia (+ persisted state plugin for settings).
- Rendering mode: client-side (`ssr: false`).
- Dev server port: `3500` (from `nuxt.config.ts`).
- Main runtime dependency: Bitcoin JSON-RPC via HTTP Basic auth.

## 2) Local Commands (Docker-only)

Use these containerized commands locally:

- Install packages in container:

```bash
docker run --rm -it -v "$(pwd):/app" -w /app node:24-slim \
  npm install
```

- Preload GeoLite DB in container:

```bash
docker run --rm -it -v "$(pwd):/app" -w /app node:24-slim \
  npm run preload-geolite2
```

- Start dev stack:

```bash
docker compose up --build
```

- Start without rebuild:

```bash
docker compose up
```

Container networking notes:
- Host `3200` maps to container `3000`.
- Vite/HMR port `24678` is exposed.

General script pattern (still containerized):

```bash
docker run --rm -it -v "$(pwd):/app" -w /app node:24-slim npm run <script>
```

## 3) Runtime Configuration

Primary runtime setting:
- `NUXT_BITCOIN_NODE_CREDENTIALS`

Expected shape (JSON array):

```json
[
  {
    "name": "Node-Runner-1",
    "user": "username",
    "password": "password",
    "host": "192.168.1.420",
    "port": "8332",
    "protocol": "http"
  }
]
```

Credential source fallback order:
1. `runtimeConfig.bitcoinNodeCredentials` (env-driven)
2. `server/utils/bitcoinNodeCredentials.json`

## 4) High-Level Architecture

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
- Thin Nuxt server endpoints in `server/api/**`.
- Each endpoint validates input with Zod and/or shared schema.
- Node RPC access through `server/utils/bitcoinRpcClient.ts`.
- Errors normalized by `sendErrorResponse` in `server/utils/errors.ts`.

## 5) Data Flow (Important)

1. `app/app.vue` loads node names (`/api/getNodeNames`).
2. Sidebar/menu renders from `bitcoinStore.nodeNames`.
3. Dashboard (`index.vue`) polls `/api/getDashboard` per node.
4. Dashboard updates each node's `isIbd` state in the store.
5. Menu and polling behavior respond to `isIbd`:
   - IBD nodes are marked/limited in nav.
   - IBD nodes are polled on a slower interval.
6. Node-specific pages use route param `[i]` as `nodeIndex` for API calls.

## 6) Store Responsibilities

`app/stores/bitcoin.ts`
- `nodeNames`: source of truth for node list and status (`isError`, `isIbd`).
- `nodeCount`: derived from fetched node names.
- `cachedNodes`: dashboard cache used for IBD nodes.

`app/stores/appSettings.ts`
- Poll intervals for dashboard/mempool.
- Persisted to localStorage via pinia persisted state plugin.

## 7) API Surface Map

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

## 8) Mempool Visualizer Notes

The visualizer endpoint (`/api/getVisualizer`) is performance-sensitive and uses in-memory caches:
- `mempoolCache`: per node and block height
- `categoriesCache`: categorized tx groups
- `blocksCache`: recent blocks

Behavior:
- Cold start/new block: fetch full verbose mempool.
- Warm updates: fetch txid list, then batch fetch only new tx entries.
- High-priority txs are sorted by fee rate and trimmed to `MAX_VIZ_TX`.

If editing this path, preserve cache invalidation logic by block height.

## 9) Validation and Error Contract

Shared base schema:
- `AppConstants.BASE_VALIDATION_SCHEMA` enforces `nodeIndex` in [0, 32].

Error utility:
- Zod errors -> HTTP 400 with readable field messages.
- `StatusError` supports explicit HTTP status mapping.
- Unknown errors -> generic `success: false` error payload.

Rule of thumb:
- Keep API responses in `ApiResponse<T>` shape.
- Prefer throwing `StatusError` for predictable client behavior.

## 10) Common Safe-Change Playbook

When adding a new node-level page:
1. Add route page under `app/pages/<feature>/[i].vue`.
2. Add nav child entry in `app/layouts/default.vue`.
3. Implement matching `server/api/...` endpoint with Zod validation.
4. Use `BitcoinRpcClient` method or add one there.
5. Return `ApiResponse<T>` and use `sendErrorResponse` on catch.

When adding a new RPC call:
1. Add a typed method to `BitcoinRpcClient` under the correct section.
2. Add/extend shared types in `shared/types`.
3. Expose through a server API endpoint.
4. Consume via `$fetch` in page/component.

When modifying polling:
1. Update defaults in `app/stores/appSettings.ts`.
2. Verify `settings.vue` min/max bounds still make sense.
3. Confirm intervals are cleaned up in `onUnmounted`.

## 11) Known Maintenance Risks

- Security: RPC transport is HTTP by default; use network-level protection (VPN, tunnel, reverse proxy) in production.
- Geo lookup dependency: GeoLite DB must exist (`npm run preload-geolite2`) for geo features.
- Route `nodeIndex` handling: pages parse from URL; invalid params should be guarded carefully.
- API input validation gaps: ban endpoints note TODO for stricter IP validation.

## 12) Files To Read First Before Major Changes

- `app/layouts/default.vue`
- `app/pages/index.vue`
- `app/components/block-visualizer-html.vue`
- `app/stores/bitcoin.ts`
- `server/api/getVisualizer.post.ts`
- `server/utils/bitcoinRpcClient.ts`
- `server/utils/errors.ts`

## 13) Fast Debug Checklist

- Node list empty: check `NUXT_BITCOIN_NODE_CREDENTIALS` and `/api/getNodeNames`.
- One page failing: test corresponding `/api/...` endpoint directly.
- Peer map empty: verify GeoLite DB preload and `/api/geoip/batch` response.
- Menu disabled unexpectedly: inspect `nodeNames[i].isIbd` and dashboard polling state.
- Visualizer stale: inspect block height changes and cache key behavior (`nodeIndex + blockCount`).

## 14) Companion Maintainer Docs

- `MAINTAINER_DOCS_INDEX.md`: quick entry point to all maintainer docs.
- `RELEASE_CHECKLIST.md`: versioning, validation, and release gate checklist.
- `TROUBLESHOOTING_MATRIX.md`: symptom-to-diagnosis guide.
- `CODING_STANDARDS.md`: coding conventions and API/error patterns.
