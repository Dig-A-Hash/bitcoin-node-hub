import { DashboardNode, DashboardResponse } from '~~/server/types/dashboard';
import { NetworkInfo, BlockchainInfo } from '~~/server/types/bitcoinCore';

export default defineEventHandler(async (): Promise<DashboardResponse> => {
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
    const formattedResults = results.map((result) =>
      result.status === 'fulfilled' ? result.value : result.reason
    );

    return {
      success: true,
      data: formattedResults,
    };
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return { success: false, error: 'Failed to fetch dashboard.' };
  }
});
