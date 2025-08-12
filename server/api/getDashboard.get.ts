// server/api/getDashboard.get.ts
import client from '../utils/bitcoinCoreClient';
import { getBitcoinClients } from '~~/server/utils/bitcoinCoreClients';
import { NetworkInfo, BlockchainInfo } from '../utils/bitcoinCoreTypes';
import BitcoinCore from 'bitcoin-core';

export default defineEventHandler(async () => {
  try {
    const clients = getBitcoinClients();
    const metricsPromises = clients.map(
      async (client: BitcoinCore, index: number) => {
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
      }
    );

    const results = await Promise.all(metricsPromises);

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return { success: false, error: 'Failed to fetch dashboard metrics' };
  }
});

/**
 * Fetches multiple Bitcoin node metrics for dashboard display.

export default defineEventHandler(async () => {
  try {
    const [networkInfo, blockchainInfo] = await Promise.all([
      client.getNetworkInfo(),
      client.getBlockchainInfo(),
    ]);
    return {
      success: true,
      data: {
        networkInfo: networkInfo as NetworkInfo,
        blockchainInfo: blockchainInfo as BlockchainInfo,
      },
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return { success: false, error: 'Failed to fetch dashboard metrics' };
  }
});
 */
