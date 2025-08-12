import client from '../utils/bitcoinCoreClient';

/**
 * Returns information about the node’s memory pool (mempool),
 * which contains unconfirmed transactions.
 */
export default defineEventHandler(async () => {
  try {
    const result = await client.getMempoolInfo();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'Failed to fetch.' };
  }
});
