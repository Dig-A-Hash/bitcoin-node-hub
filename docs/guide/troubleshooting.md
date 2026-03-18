# Troubleshooting

## Basic RPC connectivity test

Use curl to verify node RPC connectivity and credentials:

```bash
curl -v --user {USERNAME}:{PASSWORD} \
--data-binary '{"jsonrpc":"1.0","id":"test","method":"uptime","params":[]}' \
-H 'content-type: text/plain;' {HOST_URL}
```

If this fails, check host reachability, RPC bind settings, allowlists, and credentials.

## Common checks

1. Verify `NUXT_BITCOIN_NODE_CREDENTIALS` is valid JSON.
2. Verify each node host and port are reachable from app runtime.
3. Verify RPC user has required methods whitelisted.
4. Verify security controls are not blocking trusted traffic unexpectedly.
5. Verify app was restarted after configuration changes.

## Docker workflow checks

Use the documented install and restart sequence from `/guide/docker` when local state becomes inconsistent.

## Authentication checks

- If login is unexpectedly required, check `ADMIN_PASSWORD_HASH`.
- If login fails after enabling auth, verify `NUXT_SESSION_PASSWORD` and hash generation flow.

## Docs deployment checks

For docs site build and Amplify issues, use `/guide/deployment-amplify`.
Remember: Amplify documentation deployment is separate from app runtime deployment.
