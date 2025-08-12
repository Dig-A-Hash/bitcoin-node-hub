import client from '../utils/bitcoinCoreClient';

/**
 * Returns a list of transaction IDs in the mempool, with verbose
 * details about each transaction (e.g., fees, size).
 */
export default defineEventHandler(async () => {
  try {
    const result = await client.getRawMempool(true);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'Failed to fetch.' };
  }
});
