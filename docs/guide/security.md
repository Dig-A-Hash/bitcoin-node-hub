# Security

Bitcoin Node Hub should be treated similarly to Bitcoin node operations: run it on your own hardware and private network boundaries.

## Hosting posture

- Recommended: self-hosted on private infrastructure you control.
- Discouraged: direct exposure to the public internet.
- Required mindset: assume RPC transport is sensitive and protect it accordingly.

## Why public exposure is risky

Bitcoin node RPC traffic is commonly HTTP without built-in TLS on the node endpoint.
If exposed carelessly, credentials and operational metadata can be intercepted or abused.

## Network protection guidance

Use one or more of the following controls:

- VPN between Bitcoin Node Hub and node hosts.
- SSH tunneling where operationally appropriate.
- TLS termination via a carefully configured reverse proxy.
- Strict host firewall rules and limited source IP allowlists.

## Access control guidance

- Use dedicated RPC users with minimal method whitelists.
- Avoid broad wildcard RPC permissions.
- Rotate credentials if compromise is suspected.
- Keep optional admin authentication enabled when required by your environment.

## Important reminder

This project includes full Docker support, but Docker alone is not a security control. Your network design and credential hygiene are the core protections.

## Related docs

- `/guide/bitcoin-node-setup`
- `/guide/configuration`
- `/guide/authentication`
- `/guide/docker`
