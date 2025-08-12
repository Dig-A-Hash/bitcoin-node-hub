// server/api/dashboardMetrics.get.ts
import client from '../utils/bitcoinCoreClient';
import {
  ChainTxStats,
  MemoryInfo,
  NetworkInfo,
  BlockchainInfo,
} from '../utils/bitcoinCoreTypes';

/**
 * Fetches multiple Bitcoin node metrics for dashboard display.
 */
export default defineEventHandler(async () => {
  try {
    const [chainTxStats, memoryInfo, networkInfo, blockchainInfo] =
      await Promise.all([
        client.getChainTxStats(),
        client.getMemoryInfo(),
        client.getNetworkInfo(),
        client.getBlockchainInfo(),
      ]);
    return {
      success: true,
      data: {
        chainTxStats: chainTxStats as ChainTxStats,
        memoryInfo: memoryInfo as MemoryInfo,
        networkInfo: networkInfo as NetworkInfo,
        blockchainInfo: blockchainInfo as BlockchainInfo,
      },
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return { success: false, error: 'Failed to fetch dashboard metrics' };
  }
});
