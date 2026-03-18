# Troubleshooting Matrix

Use this as a symptom-first debugging guide.

## 1) App Does Not Show Nodes

Symptoms:
- Sidebar has no node items.
- Dashboard shows empty or no cards.

Likely causes:
- Invalid or missing `NUXT_BITCOIN_NODE_CREDENTIALS`.
- Fallback credential file is missing/invalid.

Checks:
- Verify credential JSON shape.
- Check `/api/getNodeNames` response.
- Check browser and server logs for parsing/runtime errors.

## 2) One Node Fails, Others Work

Symptoms:
- Single node card/page errors.

Likely causes:
- Wrong host/port/user/password for that node.
- Node RPC interface not reachable from app network.

Checks:
- Confirm node index aligns with credential order.
- Validate RPC with curl from a controlled test path.
- Check endpoint response for that exact `nodeIndex`.

## 3) Dashboard Looks Stale

Symptoms:
- Metrics stop updating.

Likely causes:
- Poll interval set too high.
- IBD mode causing slower polling path.

Checks:
- Inspect values in settings store.
- Confirm `isIbd` state in `bitcoinStore.nodeNames`.
- Confirm page lifecycle mounted/unmounted correctly.

## 4) Mempool Visualizer Not Updating

Symptoms:
- Block height and tx blocks do not change.

Likely causes:
- Endpoint/cache mismatch at current block height.
- RPC issues on mempool calls.

Checks:
- Validate `/api/getVisualizer` payload.
- Confirm latest block count changes are seen.
- Verify cache behavior by `nodeIndex + blockCount`.

## 5) Peer Map Empty

Symptoms:
- Table may render but map has no markers.

Likely causes:
- Missing GeoLite DB.
- Peer addresses unresolved or filtered.
- `/api/geoip/batch` failures.

Checks:
- Run GeoLite preload command in Docker.
- Inspect geo batch response for valid coordinates.
- Verify peers include routable ipv4/ipv6 addresses.

## 6) Ban Actions Fail

Symptoms:
- Remove/Set/Clear ban calls return errors.

Likely causes:
- RPC permissions or node config restrictions.
- Invalid IP/address format submitted.

Checks:
- Verify `/api/ban/*` responses.
- Confirm node RPC auth and ban-related method support.
- Check ip input normalization at client and server.

## 7) Settings Not Persisting

Symptoms:
- Poll settings reset after refresh.

Likely causes:
- localStorage blocked/unavailable.
- Persisted state plugin issue.

Checks:
- Verify Pinia persisted state is active.
- Inspect browser storage for config store values.

## 8) Docker Dev Server Not Reachable

Symptoms:
- Browser cannot open local app.

Likely causes:
- Compose service not running.
- Port conflict on host.

Checks:
- Confirm `docker compose up --build` runs cleanly.
- Confirm mapping host `3200` to container `3000`.
- Confirm HMR port `24678` exposure for live reload.

## 9) Login Endpoint Returns 403

Symptoms:
- `POST /api/login` returns 403.
- Login page cannot authenticate.

Likely causes:
- `ADMIN_PASSWORD_HASH` is missing or empty.
- Optional authentication is currently disabled by configuration.

Checks:
- Set a valid `ADMIN_PASSWORD_HASH` to enable authentication.
- Confirm `NUXT_SESSION_PASSWORD` is set when authentication is enabled.
- Regenerate `ADMIN_PASSWORD_HASH` if you suspect a bad value.
