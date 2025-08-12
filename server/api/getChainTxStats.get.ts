import client from '../utils/bitcoinCoreClient';
import type { ChainTxStats } from '../utils/bitcoinCoreTypes';

/**
 * Computes statistics about the total number and rate of transactions
 * in the blockchain.
 */
export default defineEventHandler(async () => {
  try {
    const result: ChainTxStats = await client.getChainTxStats();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'Failed to fetch.' };
  }
});
