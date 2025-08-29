import { DashboardNode } from '~~/shared/types/dashboard';
import { NetworkInfo, BlockchainInfo } from '~~/shared/types/bitcoinCore';
import { ApiResponse } from '~~/shared/types/apiResponse';
import { sendErrorResponse } from '../utils/errors';

export default defineEventHandler(
  async (event): Promise<ApiResponse<DashboardNode[]>> => {
    try {
      const bitcoinNodeCredentials = getBitcoinNodeCredentials();

      const metricsPromises = bitcoinNodeCredentials.map(
        async (bitcoinNodeCredential, index) => {
          try {
            const rpc = createBitcoinRpc(bitcoinNodeCredential);

            const [networkInfo, blockchainInfo] = await Promise.all([
              rpc
                .post('', {
                  jsonrpc: '1.0',
                  id: 'nuxt-rpc',
                  method: 'getnetworkinfo',
                  params: [],
                })
                .then((res) => res.data.result),
              rpc
                .post('', {
                  jsonrpc: '1.0',
                  id: 'nuxt-rpc',
                  method: 'getblockchaininfo',
                  params: [],
                })
                .then((res) => res.data.result),
            ]);
            return {
              nodeIndex: index,
              name: bitcoinNodeCredential.name,
              host: bitcoinNodeCredential.host,
              networkInfo: networkInfo as NetworkInfo,
              blockchainInfo: blockchainInfo as BlockchainInfo,
            } as DashboardNode;
          } catch (error: any) {
            console.error(`Node ${index} error:`, error.message);
            return {
              nodeIndex: index,
              host: bitcoinNodeCredential.host,
              error: `Node ${index} failed: ${error.message}`,
            };
          }
        }
      );

      const results = await Promise.allSettled(metricsPromises);
      const dashboardNodes: DashboardNode[] = results.map((result) =>
        result.status === 'fulfilled' ? result.value : result.reason
      );

      return {
        data: dashboardNodes,
        success: true,
      } as ApiResponse<DashboardNode[]>;
    } catch (error) {
      return sendErrorResponse(event, error);
    }
  }
);
