import { getBitcoinClients } from '~~/server/utils/bitcoinCoreClients';
import {
  NetworkInfo,
  BlockchainInfo,
  DashboardResponse,
} from '~~/server/utils/bitcoinCoreTypes';
import BitcoinCore from 'bitcoin-core';

/**
 * Fetches multiple Bitcoin node metrics for dashboard display.
 */
export default defineEventHandler(async (): Promise<DashboardResponse> => {
  try {
    const clients = getBitcoinClients();
    const metricsPromises = clients.map(
      async (client: BitcoinCore, index: number) => {
        try {
          const [networkInfo, blockchainInfo] = await Promise.all([
            client.getNetworkInfo(),
            client.getBlockchainInfo(),
          ]);
          return {
            nodeIndex: index,
            host: client.host,
            networkInfo: networkInfo as NetworkInfo,
            blockchainInfo: blockchainInfo as BlockchainInfo,
          };
        } catch (error: any) {
          return {
            nodeIndex: index,
            host: client.host,
            error: `Node ${index} failed: ${error.message}`,
          };
        }
      }
    );

    const results = await Promise.allSettled(metricsPromises);
    const formattedResults = results.map((result) => {
      return result.status === 'fulfilled' ? result.value : result.reason;
    });

    return {
      success: true,
      data: formattedResults,
    };
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return { success: false, error: 'Failed to fetch dashboard.' };
  }
});
