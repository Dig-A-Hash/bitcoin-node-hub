import client from '../utils/bitcoinCoreClient';

export default defineEventHandler(async () => {
  try {
    const result = await client.getBlockchainInfo();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'Failed to fetch.' };
  }
});
