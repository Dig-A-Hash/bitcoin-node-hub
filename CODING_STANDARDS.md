# Coding Standards

This project standard keeps maintenance predictable and safe.

## 1) Workflow Standard

- Local workflow is Docker-only.
- Do not run Node.js or npm directly on host.
- Use README Docker commands for install/run/preload.
- Never read local .env files because they contain secrets.
- If env details are needed, use the schema documented in README.

## 2) API Endpoint Standards

- Validate input with Zod before RPC calls.
- Use shared schema pieces when possible (`AppConstants.BASE_VALIDATION_SCHEMA`).
- Return consistent `ApiResponse<T>` shape.
- Route all caught errors through `sendErrorResponse`.
- Use `StatusError` for deliberate status codes.

## 3) RPC Layer Standards

- Add new Bitcoin RPC calls inside `server/utils/bitcoinRpcClient.ts`.
- Keep method names close to Bitcoin Core RPC naming.
- Keep return types explicit and sourced from shared type definitions.

## 4) Type Standards

- Prefer shared types under `shared/types` for API payloads.
- Avoid introducing untyped `any` in new code unless unavoidable.
- Update affected types first when adding data fields.

## 5) Frontend Standards

- Keep page-level fetch logic in page components.
- Keep reusable logic in composables and utility helpers.
- Keep UI state local unless multiple routes/components need it.
- Use store only for cross-page state (node list/status/settings).

## 6) Polling and Lifecycle Standards

- All intervals must be cleared in unmount hooks.
- Respect separate polling cadence for IBD vs non-IBD where applicable.
- Settings page bounds should match operational safe values.

## 7) Caching Standards (Visualizer)

- Preserve cache invalidation keyed by block height.
- Ensure stale transactions are removed on warm updates.
- Keep category calculations deterministic and idempotent.

## 8) Error and Logging Standards

- Log diagnostic context server-side for maintainers.
- Keep client-facing errors concise and non-sensitive.
- Never leak credentials or auth headers in logs.

## 9) Security Standards

- Never commit real node credentials.
- Treat RPC transport as insecure unless network protections are in place.
- Keep examples sanitized and test-safe.
- Never inspect .env contents during maintenance tasks.

## 10) Documentation Standards

- Update maintainer docs when adding routes/endpoints/stores.
- Add troubleshooting entries for new failure modes.
- Keep README user-focused and maintainer detail in maintainer docs.
