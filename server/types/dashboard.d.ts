export interface DashboardNode {
  nodeIndex: number;
  name: string;
  host: string;
  blockchainInfo: BlockchainInfo;
  networkInfo: NetworkInfo;
  error?: string;
}

export interface DashboardResponse {
  success: boolean;
  data?: Array<DashboardNode>;
  error?: string;
}
