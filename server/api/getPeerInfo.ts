import { z } from 'zod';
import { PeerInfo } from '~~/shared/types/bitcoinCore';
import { ApiResponse } from '~~/shared/types/apiResponse';
import { sendErrorResponse } from '~~/server/utils/errors';

export default defineEventHandler(
  async (event): Promise<ApiResponse<PeerInfo[]>> => {
    try {
      const { nodeIndex } = z
        .object({ nodeIndex: z.string() })
        .parse(getQuery(event));
      const bitcoinNodeCredentials = getBitcoinNodeCredentials();
      const rpc = createBitcoinRpc(bitcoinNodeCredentials[parseInt(nodeIndex)]);

      const response = await rpc.post('', {
        jsonrpc: '1.0',
        id: 'nuxt-rpc',
        method: 'getpeerinfo',
        params: [],
      });

      return {
        success: true,
        data: response.data.result as PeerInfo[],
      } as ApiResponse<PeerInfo[]>;
    } catch (error: any) {
      return sendErrorResponse(event, error);
    }
  }
);
