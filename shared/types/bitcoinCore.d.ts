export interface ChainTxStats {
  time: number; // Timestamp of the stats
  txcount: number; // Total number of transactions
  window_final_block_hash: string; // Hash of the final block in the window
  window_final_block_height: number; // Height of the final block
  window_block_count: number; // Number of blocks in the window
  window_interval: number; // Time interval of the window in seconds
  window_tx_count: number; // Number of transactions in the window
  txrate: string; // Transaction rate in transactions per second
}

export interface MemoryInfo {
  locked: {
    used: number; // Memory used in bytes
    free: number; // Memory free in bytes
    total: number; // Total memory in bytes
    locked: number; // Locked memory in bytes
    chunks_used: number; // Number of used memory chunks
    chunks_free: number; // Number of free memory chunks
  };
}

export interface NetworkInfo {
  version: number; // Bitcoin Core version
  subversion: string; // Bitcoin Core subversion string
  protocolversion: number; // Protocol version
  localservices: string; // Local services bitmask
  localservicesnames: string[]; // Array of local service names (e.g., NETWORK, BLOOM)
  localrelay: boolean; // Whether relay is enabled
  timeoffset: number; // Time offset in seconds
  networkactive: boolean; // Whether the network is active
  connections: number; // Total number of connections
  connections_in: number; // Number of inbound connections
  connections_out: number; // Number of outbound connections
  networks: {
    name: 'ipv4' | 'ipv6' | 'onion' | 'i2p' | 'cjdns'; // Network type
    limited: boolean; // Whether the network is limited
    reachable: boolean; // Whether the network is reachable
    proxy: string; // Proxy address, if any
    proxy_randomize_credentials: boolean; // Whether proxy credentials are randomized
  }[];
  relayfee: number; // Minimum relay fee in BTC/kB
  incrementalfee: number; // Incremental fee in BTC/kB
  localaddresses: {
    address: string; // Local address
    port: number; // Port number
    score: number; // Address score
  }[];
  warnings: string[]; // Array of warning messages
}

export interface BlockchainInfo {
  chain: 'main' | 'test' | 'regtest'; // Current chain
  blocks: number; // Number of blocks in the chain
  headers: number; // Number of headers known
  bestblockhash: string; // Hash of the best block
  difficulty: string; // Current difficulty as a string
  time: number; // Timestamp of the best block
  mediantime: number; // Median time of recent blocks
  verificationprogress: string; // Progress toward verifying all blocks (0 to 1)
  initialblockdownload: boolean; // Whether the node is in initial block download mode
  chainwork: string; // Total work in the chain
  size_on_disk: number; // Blockchain size on disk in bytes
  pruned: boolean; // Whether the blockchain is pruned
  warnings: string[]; // Array of warning messages
}

export interface MiningInfo {
  blocks: number; // Number of blocks in the chain
  difficulty: string; // Current mining difficulty as a string
  networkhashps: string; // Network hash rate in hashes per second
  pooledtx: number; // Number of transactions in the mempool
  chain: 'main' | 'test' | 'regtest'; // Current chain
  warnings: string[]; // Array of warning messages
}

interface BitcoinBlockHeader {
  hash: string; // Unique hash of the block
  confirmations: number; // Number of confirmations for the block
  height: number; // Block height in the blockchain
  version: number; // Block version number
  versionHex: string; // Block version in hexadecimal format
  merkleroot: string; // Merkle root of the block's transactions
  time: number; // Unix timestamp of when the block was mined
  mediantime: number; // Median timestamp of recent blocks
  nonce: number; // Nonce used for mining
  bits: string; // Target difficulty in compact format
  difficulty: string; // Mining difficulty as a decimal string
  chainwork: string; // Total work in the blockchain up to this block (hex)
  nTx: number; // Number of transactions in the block
  previousblockhash: string; // Hash of the previous block
  strippedsize: number; // Size of the block without witness data (bytes)
  size: number; // Total size of the block (bytes)
  weight: number; // Block weight for segwit calculations
  tx: string[]; // Array of transaction IDs in the block
}

interface PeerInfo {
  id: number; // Unique identifier for the peer
  addr: string; // Remote address and port of the peer (e.g., "131.153.242.115:8333")
  addrbind: string; // Local address and port used to connect to the peer (e.g., "127.0.0.1:42658")
  addrlocal: string; // Local address as seen by the peer (e.g., "185.220.100.240:61477")
  network: string; // Network type (e.g., "ipv4", "ipv6", "tor")
  services: string; // Services offered by the peer, encoded as a hex string (e.g., "0000000000000c09")
  servicesnames: string[]; // Array of service names supported by the peer (e.g., ["NETWORK", "WITNESS"])
  relaytxes: boolean; // Whether transactions are relayed to this peer
  lastsend: number; // Unix timestamp of the last message sent to the peer
  lastrecv: number; // Unix timestamp of the last message received from the peer
  last_transaction: number; // Unix timestamp of the last transaction received from the peer
  last_block: number; // Unix timestamp of the last block received from the peer
  bytessent: number; // Total bytes sent to the peer
  bytesrecv: number; // Total bytes received from the peer
  cpu_load: string; // CPU load of the peer, as a string (e.g., "0.169779457289712")
  conntime: number; // Unix timestamp when the connection was established
  timeoffset: number; // Time offset between local and peer clocks, in seconds
  pingtime: number; // Ping time to the peer, in seconds
  minping: number; // Minimum ping time observed, in seconds
  version: number; // Protocol version of the peer (e.g., 70016)
  subver: string; // Software version of the peer (e.g., "/Satoshi:27.1.0/")
  inbound: boolean; // Whether the connection is inbound (peer initiated)
  bip152_hb_to: boolean; // Whether BIP152 high-bandwidth mode is enabled for sending
  bip152_hb_from: boolean; // Whether BIP152 high-bandwidth mode is enabled for receiving
  startingheight: number; // Blockchain height when the connection started
  presynced_headers: number; // Number of pre-synced headers (-1 if not applicable)
  synced_headers: number; // Latest header height synchronized with the peer
  synced_blocks: number; // Latest block height synchronized with the peer
  inflight: number[]; // Array of block heights currently being requested
  addr_relay_enabled: boolean; // Whether address relay is enabled for this peer
  addr_processed: number; // Number of addresses processed from this peer
  addr_rate_limited: number; // Number of addresses rate-limited from this peer
  permissions: string[]; // Array of special permissions granted to the peer
  forced_inbound: boolean; // Whether the peer is a forced inbound connection
  minfeefilter: number; // Minimum fee rate for transactions (satoshi per byte)
  bytessent_per_msg: { [key: string]: number }; // Bytes sent per message type (e.g., { "ping": 8903 })
  bytesrecv_per_msg: { [key: string]: number }; // Bytes received per message type (e.g., { "blocktxn": 2982076 })
  connection_type: string; // Type of connection (e.g., "block-relay-only")
  transport_protocol_type: string; // Transport protocol used (e.g., "v2")
  session_id: string; // Unique session identifier for the connection
  misbehavior_score: number; // Score tracking peer misbehavior (0 for no issues)
}

export interface BitcoinNodeCredential {
  user: string;
  password: string;
  host: string;
  port: string;
  name: string;
}
