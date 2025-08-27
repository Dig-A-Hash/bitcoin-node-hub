import { BlockchainInfo } from '~~/server/types/bitcoinCore';
import { BlockchainInfoResponse } from '~~/server/types/blockchainInfo';

export default defineEventHandler(
  async (event): Promise<BlockchainInfoResponse> => {
    try {
      const { host } = getQuery(event);
      const bitcoinNodeCredentials = getBitcoinNodeCredentials(host as string);
      const rpc = createBitcoinRpc(bitcoinNodeCredentials[0]);

      const response = await rpc.post('', {
        jsonrpc: '1.0',
        id: 'nuxt-rpc',
        method: 'getblockchaininfo',
        params: [],
      });

      return {
        success: true,
        data: response.data.result as BlockchainInfo,
      } as BlockchainInfoResponse;
    } catch (error) {
      console.error('Error fetching:', error);
      return { success: false, error: 'Failed to fetch.' };
    }
  }
);
