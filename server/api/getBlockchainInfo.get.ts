import { z } from 'zod';
import { BlockchainInfo } from '~~/shared/types/bitcoinCore';
import { ApiResponse } from '~~/shared/types/apiResponse';
import { sendErrorResponse } from '../utils/errors';

export default defineEventHandler(
  async (event): Promise<ApiResponse<BlockchainInfo>> => {
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
      } as ApiResponse<BlockchainInfo>;
    } catch (error: any) {
      return sendErrorResponse(event, error);
    }
  }
);
