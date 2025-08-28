import { z } from 'zod';
import { PeerInfo } from '~~/server/types/bitcoinCore';
import { ApiResponse } from '~~/server/types/apiResponse';
import { sendErrorResponse } from '../utils/errors';

export default defineEventHandler(
  async (event): Promise<ApiResponse<PeerInfo>> => {
    try {
      const { host } = z.object({ host: z.string() }).parse(getQuery(event));
      const bitcoinNodeCredentials = getBitcoinNodeCredentials(host as string);
      const rpc = createBitcoinRpc(bitcoinNodeCredentials[0]);

      const response = await rpc.post('', {
        jsonrpc: '1.0',
        id: 'nuxt-rpc',
        method: 'getpeerinfo',
        params: [],
      });

      return {
        success: true,
        data: response.data.result as PeerInfo,
      } as ApiResponse<PeerInfo>;
    } catch (error: any) {
      return sendErrorResponse(event, error);
    }
  }
);
