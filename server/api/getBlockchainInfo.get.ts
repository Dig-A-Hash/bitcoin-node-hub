import { z } from 'zod';
import { BlockchainInfo } from '~~/server/types/bitcoinCore';
import { BlockchainInfoResponse } from '~~/server/types/blockchainInfo';

export default defineEventHandler(
  async (event): Promise<BlockchainInfoResponse> => {
    try {
      const { host } = z.object({ host: z.string() }).parse(getQuery(event));
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
    } catch (error: any) {
      console.error('Error fetching:', error);

      return {
        success: false,
        error: error.name === 'ZodError' ? error : 'Error fetching data.',
      } as BlockchainInfoResponse;
    }
  }
);
