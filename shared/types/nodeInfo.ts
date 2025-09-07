import type {
  BlockchainInfo,
  NetworkInfo,
  MempoolInfo,
  MiningInfo,
  NetTotals,
  MemoryInfo,
  Difficulty,
} from './bitcoinCore';

// New NodeInfo type combining all requested RPCs
export interface NodeInfo {
  nodeIndex: number; // Index of the node in a multi-node setup.
  name: string; // Name of the node (e.g., derived from configuration).
  host: string; // Host address of the node.
  blockchainInfo: BlockchainInfo; // Data from getblockchaininfo RPC.
  networkInfo: NetworkInfo; // Data from getnetworkinfo RPC.
  mempoolInfo: MempoolInfo; // Data from getmempoolinfo RPC.
  miningInfo: MiningInfo; // Data from getmininginfo RPC.
  netTotals: NetTotals; // Data from getnettotals RPC.
  memoryInfo: MemoryInfo; // Data from getmemoryinfo RPC.
  difficulty: Difficulty; // Data from getdifficulty RPC.
  error?: string; // Optional error message if any RPC call fails.
}
