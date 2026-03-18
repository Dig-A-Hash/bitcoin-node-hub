# Code Audit

This guide explains how to audit this codebase for correctness and for suspicious behavior. Always verify, never trust.

## Audit Goal

For each server endpoint and frontend page, verify:

1. Input is validated.
2. Only expected data is read or returned.
3. Side effects are intentional and minimal.
4. Errors use the expected API contract.
5. There is no hidden data exfiltration, remote code execution, or unauthorized network access.

## Fast Endpoint Audit Workflow

Use this repeatable flow for any file in `server/api/**`.

1. Identify the route and method from the filename.
2. Confirm input validation (`AppConstants.BASE_VALIDATION_SCHEMA`, `zod`, `getQuery`, `readBody`).
3. Confirm the endpoint creates `BitcoinRpcClient(nodeIndex)` only when needed.
4. Confirm RPC methods called are exactly the methods expected for that route.
5. Confirm output shape uses `ApiResponse<T>` and never includes credentials or sensitive runtime config.
6. Confirm `catch` returns `sendErrorResponse(event, error)`.
7. Search for suspicious patterns: extra external URLs, shell execution, dynamic eval, file writes.

## Endpoint-by-Endpoint Expectations

### Core endpoints

- `GET /api/getNodeNames` (`server/api/getNodeNames.get.ts`)
  - Expected: return only `host`, `name`, and default flags from configured credentials.
  - Red flag: returning `user`, `password`, full credential object, or environment values.

- `POST /api/getDashboard` (`server/api/getDashboard.post.ts`)
  - Expected: validate `nodeIndex`, call dashboard-related RPC methods, assemble combined dashboard payload.
  - Red flag: additional unrelated RPC calls, filesystem access, or outbound web calls.

- `POST /api/getNodeInfo` (`server/api/getNodeInfo.post.ts`)
  - Expected: validate `nodeIndex`, gather node status data in parallel, return one `NodeInfo` object.
  - Red flag: writes/modifications to node state, non-read RPC methods.

- `GET /api/getPeerInfo` (`server/api/getPeerInfo.get.ts`)
  - Expected: validate `nodeIndex`, return `getpeerinfo` only.
  - Red flag: any ban action or mutation inside this route.

- `GET /api/getTransaction` (`server/api/getTransaction.get.ts`)
  - Expected: validate `nodeIndex` and `txid` length, call `getrawtransaction`.
  - Red flag: accepting arbitrary command input or skipping txid validation.

- `POST /api/getVisualizer` (`server/api/getVisualizer.post.ts`)
  - Expected: validate `nodeIndex`, read mempool and block data, use in-memory caches only.
  - Red flag: persistent disk writes, unbounded cache growth, or hidden external APIs.

### Ban endpoints

- `GET /api/ban/listBanned` (`server/api/ban/listBanned.get.ts`)
  - Expected: read-only list of bans.

- `POST /api/ban/setBan` (`server/api/ban/setBan.post.ts`)
  - Expected: validate `nodeIndex`, `ipAddress`, and bounded `banTime`, then set ban.
  - Note: the file currently has a TODO for stricter IP validation.

- `POST /api/ban/removeBan` (`server/api/ban/removeBan.post.ts`)
  - Expected: validate input and remove ban for target IP.

- `POST /api/ban/clearBanned` (`server/api/ban/clearBanned.post.ts`)
  - Expected: validate `nodeIndex`, clear all bans.
  - Red flag: route accessible without intended auth policy in your deployment.

### Geo endpoints

- `GET /api/geoip/:ip` (`server/api/geoip/[ip].ts`)
  - Expected: validate IP, lookup in local GeoLite database, return location fields.
  - Red flag: network calls to unexpected third-party APIs.

- `POST /api/geoip/batch` (`server/api/geoip/batch.post.ts`)
  - Expected: validate input array and IPs, lookup locally, return location list.
  - Red flag: accepting massive unbounded arrays without limits.

### Auth/session endpoints

- `POST /api/login` (`server/api/login.post.ts`)
  - Expected: validate password presence, verify hash, set user session only.
  - Red flag: logging passwords, returning session secrets, or bypass when hash exists.

- `POST /api/logout` (`server/api/logout.post.ts`)
  - Expected: clear session when auth is enabled.

- `GET /api/session` (`server/api/session.get.ts`)
  - Expected: return auth mode and authenticated boolean only.
  - Red flag: returning raw session payload/cookies.

## Endpoint Example Audit

Example from `server/api/getNodeInfo.post.ts`:

```ts
const { nodeIndex } = AppConstants.BASE_VALIDATION_SCHEMA.parse(
  await readBody(event)
);

const rpcClient = new BitcoinRpcClient(nodeIndex);

const [
  blockchainInfo,
  networkInfo,
  mempoolInfo,
  miningInfo,
  netTotals,
  memoryInfo,
  difficulty,
  indexInfo,
] = await Promise.all([
  rpcClient.blockchain.getBlockchainInfo(),
  rpcClient.network.getNetworkInfo(),
  rpcClient.mempool.getMempoolInfo(),
  rpcClient.mining.getMiningInfo(),
  rpcClient.network.getNetTotals(),
  rpcClient.mempool.getMemoryInfo(),
  rpcClient.mining.getDifficulty(),
  rpcClient.config.getIndexInfo(),
]);
```

How to verify it only does what it claims:

1. Input is constrained to allowed `nodeIndex` schema.
2. Only read-only RPC methods are called.
3. No filesystem access, no subprocesses, no external URLs.
4. Output is assembled into `NodeInfo` and returned via `ApiResponse<NodeInfo>`.

## Fast Frontend Audit Workflow

Use this for files in `app/pages/**`, plus key components.

1. List each API call in the file (`$fetch` or `fetch`).
2. Confirm endpoint path and payload are expected for that view.
3. Confirm no credentials/tokens are stored in localStorage or sent to third-party URLs.
4. Confirm route params are parsed and used only as needed (`nodeIndex`).
5. Confirm data is displayed, not executed as code.
6. Check timers/intervals are cleaned up in `onUnmounted`/`onBeforeUnmount`.

## Frontend Data Access Map

### App bootstrap and shell

- `app/app.vue`
  - Calls store method that loads node names once.

- `app/stores/bitcoin.ts`
  - Calls `GET /api/getNodeNames` and stores minimal node metadata.

- `app/layouts/default.vue`
  - Calls `POST /api/logout` only for sign-out flow.

- `app/middleware/auth.global.ts`
  - Uses `useUserSession()` and route redirects; no custom network calls.

### Main pages

- `app/pages/index.vue`
  - Calls `POST /api/getDashboard` with `{ nodeIndex }`.
  - Verifies `response.ok`, `payload.success`, and `payload.data` before rendering.

- `app/pages/system/[i].vue`
  - Calls `POST /api/getNodeInfo` with `{ nodeIndex }`.

- `app/pages/mempool/[i].vue`
  - Calls `POST /api/getNodeInfo` and embeds visualizer component.

- `app/components/block-visualizer-html.vue`
  - Calls `POST /api/getVisualizer` with `{ nodeIndex }`.
  - Polls on interval and clears timers on unmount.

- `app/pages/peers/[i].vue`
  - Calls `GET /api/getPeerInfo?nodeIndex=...` and `POST /api/geoip/batch`.
  - Also resolves unknown hostnames through `https://dns.google/resolve` before geo lookup.

- `app/pages/ban/[i].vue`
  - Calls `GET /api/ban/listBanned` and `POST /api/ban/removeBan`.

- `app/components/peer-details.vue`
  - Calls `POST /api/ban/setBan` for peer ban action.

- `app/pages/login.vue`
  - Calls `POST /api/login`, then fetches session state.

## Frontend Example Audit

Example from `app/pages/system/[i].vue`:

```ts
const response = await $fetch<ApiResponse<NodeInfo>>('/api/getNodeInfo', {
  method: 'POST',
  body: { nodeIndex },
});

if (response.success && response.data) {
  nodeInfo.value = response.data;
}
```

How to verify it only gets what it needs:

1. Single endpoint call for page purpose (system metrics).
2. Input is only `nodeIndex`; no unrelated fields.
3. Render logic consumes `response.data` fields directly.
4. No write/mutation endpoint calls from this page.

## How to Spot Malicious or Strange Code

Search for these patterns in both `server/**` and `app/**`.

- Dynamic code execution: `eval`, `new Function`, dynamic `import()` from user input.
- Shell execution: `child_process`, `exec`, `spawn`.
- Unexpected network egress: `fetch('http...')`, `axios('http...')`, WebSocket clients to unknown hosts.
- Secret leakage: logging auth headers, passwords, credential objects, runtime config secrets.
- Covert persistence: writing hidden files, cron-like timers that do not clean up.
- Obfuscation signs: encoded payloads, large base64 blobs, misleading variable names around network calls.

## Practical Verification Checklist

1. Build a route-to-RPC matrix and confirm each endpoint calls only expected RPC methods.
2. Confirm all endpoint errors normalize through `sendErrorResponse`.
3. Confirm no endpoint returns credentials or session internals.
4. Confirm frontend pages call only required endpoints for that screen.
5. Confirm frontend code does not send node data to third-party APIs except explicitly expected behavior.
6. Confirm all polling intervals and observers are cleaned up on unmount.
7. Confirm ban and auth flows are explicit, minimal, and visible in UI actions.

## Notes for This Repository

- The endpoint and page patterns are mostly thin and easy to audit because business logic is centralized in `server/utils/bitcoinRpcClient.ts` and response normalization in `server/utils/errors.ts`.
- The biggest ongoing audit priority is keeping input validation strict (especially IP validation on ban routes) and watching for new outbound network calls that are not required for node monitoring.
