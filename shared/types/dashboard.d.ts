import type { NetTotals } from './bitcoinCore';

export interface DashboardNode {
  nodeIndex: number;
  name: string;
  host: string;
  blockchainInfo: BlockchainInfo;
  networkInfo: NetworkInfo;
  indexInfo: IndexInfo;
  upTime: number;
  netTotals: NetTotals;
  error?: string;
}
