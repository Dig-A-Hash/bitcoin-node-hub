export interface DashboardNode {
  nodeIndex: number;
  name: string;
  host: string;
  blockchainInfo: BlockchainInfo;
  networkInfo: NetworkInfo;
  error?: string;
}
