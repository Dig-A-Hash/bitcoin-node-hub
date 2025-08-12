import client from '../utils/bitcoinCoreClient';

export default defineEventHandler(async () => {
  try {
    const height = await client.getBlockCount();
    const hash = await client.getBlockHash(height);
    const block = await client.getBlock(hash);
    return { success: true, data: block };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'Failed to fetch.' };
  }
});
