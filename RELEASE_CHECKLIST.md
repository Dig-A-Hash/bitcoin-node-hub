# Release Checklist

This checklist is for maintainers preparing a release of Bitcoin Node Hub.

## 1) Pre-Release Scope Control

- Confirm target version and release intent (patch/minor/major).
- Confirm included features and bug fixes.
- Confirm no unfinished toggles or debug code remains.

## 2) Security and Config Checks

- Confirm no real credentials are committed.
- Confirm `NUXT_BITCOIN_NODE_CREDENTIALS` documentation/examples remain sanitized.
- Confirm RPC access assumptions are documented (HTTP transport, network protection).

## 3) Docker-Only Local Validation

Important owner preference:
- Do not run Node.js or npm directly on the host machine.
- Use only containerized commands.

Run local checks using Docker:

```bash
docker run --rm -it -v "$(pwd):/app" -w /app node:24-slim \
  npm install
```

```bash
docker run --rm -it -v "$(pwd):/app" -w /app node:24-slim \
  npm run preload-geolite2
```

```bash
docker compose up --build
```

## 4) Smoke-Test Routes

- Dashboard loads and node cards render.
- System page loads for at least one node.
- Mempool page loads visualizer and updates over time.
- Peers page loads table and map markers.
- Ban page can list bans and remove one (test environment only).
- Settings page updates polling values and persists after refresh.

## 5) API Contract Checks

- `GET /api/getNodeNames` returns expected list shape.
- `POST /api/getDashboard` validates `nodeIndex` and handles unreachable node cleanly.
- `POST /api/getNodeInfo` returns complete payload.
- `POST /api/getVisualizer` returns transactions, blocks, counts, category summaries.
- `GET /api/getPeerInfo` returns peer list.
- Ban endpoints return `ApiResponse` shape on success/error.

## 6) Regression Risk Focus

- Dynamic navigation behavior in layout.
- IBD detection and slow polling path.
- Mempool cache invalidation by block height.
- Geo lookup behavior when GeoLite DB is missing/outdated.

## 7) Versioning and Changelog

- Update version in `package.json`.
- Add concise release notes: fixed, changed, known limits.
- Mention user-visible config changes and migration notes.

## 8) Final Gate

- No unresolved blocker bug in core routes.
- No accidental host-only commands in maintainer docs.
- Documentation updates included for any new endpoint/page.
- Tag/release process can proceed.
