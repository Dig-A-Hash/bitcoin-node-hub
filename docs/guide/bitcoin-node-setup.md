# Bitcoin Node Setup

Connecting Bitcoin Node Hub to a node requires secure RPC configuration on each node.

## Core recommendations

- Use `rpcauth` instead of plaintext `rpcuser` and `rpcpassword` in node config.
- Bind RPC only to interfaces you need.
- Allow only source hosts that should access RPC.
- Whitelist only methods needed by Bitcoin Node Hub.

## Minimal read-only example

```conf
listen=1
server=1

rpcbind=127.0.0.1
rpcbind=192.168.1.420

rpcallowip=192.168.1.69

rpcauth=bitcoin-node-hub:{SaltedPasswordHash}

rpcwhitelist=bitcoin-node-hub:getblock,getblockchaininfo,getblockcount,getblockhash,getrawtransaction,getindexinfo,getmemoryinfo,getmempoolentry,getmempoolinfo,getrawmempool,getdifficulty,getmininginfo,getnetworkinfo,getnettotals,getpeerinfo,uptime
rpcwhitelistdefault=0

txindex=1
disablewallet=1
```

This configuration supports monitoring and lookup workflows. It does not include ban-management methods by default.

## Enable ban management only if needed

If you need ban features, add only the exact RPC ban methods required instead of widening permissions broadly.

## Generate rpcauth

```bash
wget https://raw.githubusercontent.com/bitcoin/bitcoin/master/share/rpcauth/rpcauth.py
python3 rpcauth.py bitcoin-node-hub
```

The script outputs:

- a full `rpcauth=...` line for node config,
- a generated plaintext password to use in `NUXT_BITCOIN_NODE_CREDENTIALS`.

## Security reminders

- Do not expose RPC broadly.
- Prefer private network boundaries and strict allowlists.
- Rotate RPC credentials if compromise is suspected.

See `/guide/security` for deployment posture and transport guidance.
