# Bitcoin Node Setup

Connecting Bitcoin Node Hub to a node requires secure RPC configuration on each node.

## Top Level Recommendations

- Use `rpcauth` instead of plaintext `rpcuser` and `rpcpassword` in node config.
- Bind RPC only to interfaces you need.
- Allow only source hosts that should access RPC.
- Whitelist only methods needed by Bitcoin Node Hub.
- Rotate RPC credentials if compromise is suspected.

## Node Config

Connecting to nodes requires specific settings in the Bitcoin configuration file on each node. For Bitcoin Node Hub, the safer approach is to use `rpcauth` with a dedicated read-only RPC user, bind only to the interfaces you actually need, and whitelist only the RPC methods required by the app.

Do not expose RPC on `0.0.0.0`. Prefer loopback plus the specific LAN IP that the node should listen on, and restrict `rpcallowip` to the exact host running Bitcoin Node Hub.

## Minimal Read-Only Permissions

The example below is the minimum read-only configuration for monitoring and viewing node data. It is appropriate when you want dashboard, peer, mempool, and transaction lookup access without granting administrative RPC permissions.


```Bitcoin-Configuration-File
# Bind only to interfaces you actually need.
rpcbind=127.0.0.1
rpcbind=192.168.1.420

# Allow only the Bitcoin Node Hub host to access your node.
rpcallowip=192.168.1.69

# Dedicated read-only RPC user for Bitcoin Node Hub
rpcauth=bitcoin-node-hub:{SaltedPasswordHash}

# Allow only the RPC methods needed for read-only monitoring
rpcwhitelist=bitcoin-node-hub:getblock,getblockchaininfo,getblockcount,getblockhash,getrawtransaction,getindexinfo,getmemoryinfo,getmempoolentry,getmempoolinfo,getrawmempool,getdifficulty,getmininginfo,getnetworkinfo,getnettotals,getpeerinfo,uptime

# Deny anything not explicitly whitelisted
rpcwhitelistdefault=0

# Required if you want transaction lookup by txid
txindex=1

# If this node does not use wallet functionality, disable it
disablewallet=1
```

If the node is not using wallet functionality, `disablewallet=1` reduces exposed attack surface and avoids loading wallet RPCs that Bitcoin Node Hub does not need for monitoring.

This configuration supports monitoring and lookup workflows. It does not include ban-management methods by default.

## Enable Ban Management if Needed

This profile is intentionally limited. It does not permit ban-management RPCs such as `setban`, `listbanned`, or `clearbanned`. If you want to use Bitcoin Node Hub ban-management features, add only those methods explicitly instead of widening access broadly.

## Generate the Salted Password Hash for rpcauth
Your node may provide the `rpcauth.py` helper to generate the `rpcauth=` value. This produces the `salt$hash` portion used in `bitcoin.conf` and avoids storing a plaintext RPC password in the config file.

This will require python3.

You can also download the helper `rpcauth.py` from the upstream repository and run it with a dedicated username:

```
wget https://raw.githubusercontent.com/bitcoin/bitcoin/master/share/rpcauth/rpcauth.py
python3 rpcauth.py bitcoin-node-hub
```

The script prints two important values:

- `String to be appended to bitcoin.conf:` followed by a full `rpcauth=...` line.
- `Your password:` followed by the cleartext password that Bitcoin Node Hub should use in `NUXT_BITCOIN_NODE_CREDENTIALS`.

Example output:

```
String to be appended to bitcoin.conf:
rpcauth=bitcoin-node-hub:3c6b5d7d4f8a1a2b$7d2d3c4b5a6f...
Your password:
uS7rYp9Kq2LmN4xV
```

In that example:

- The full `rpcauth=bitcoin-node-hub:3c6b5d7d4f8a1a2b$7d2d3c4b5a6f...` line goes into `bitcoin.conf`.
- The generated password `uS7rYp9Kq2LmN4xV` is the password Bitcoin Node Hub uses when connecting to that node.

If you prefer to provide your own password instead of having the script generate one, pass it as the second argument:

```
python3 rpcauth.py bitcoin-node-hub your-strong-rpc-password
```

Use a unique RPC account for Bitcoin Node Hub, keep its method whitelist narrow, and rotate the password if you suspect it has been exposed.

