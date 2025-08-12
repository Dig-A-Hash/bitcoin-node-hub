import client from '../utils/bitcoinCoreClient';

/**
 * Returns information about the node's memory usage, including the memory pool.
 */
export default defineEventHandler(async () => {
  try {
    const result = await client.getMemoryInfo();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching memory info:', error);
    return { success: false, error: 'Failed to fetch memory info' };
  }
});
