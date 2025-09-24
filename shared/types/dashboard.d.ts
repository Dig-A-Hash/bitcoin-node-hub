export interface DashboardNode {
  nodeIndex: number;
  name: string;
  host: string;
  blockchainInfo: BlockchainInfo;
  networkInfo: NetworkInfo;
  indexInfo: IndexInfo;
  upTime: number;
  error?: string;
}
