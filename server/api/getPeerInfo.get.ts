import { PeerInfo } from '~~/shared/types/bitcoinCore';
import { ApiResponse } from '~~/shared/types/apiResponse';
import { sendErrorResponse } from '~~/server/utils/errors';

export default defineEventHandler(
  async (event): Promise<ApiResponse<PeerInfo[]>> => {
    try {
      const { nodeIndex } = AppConstants.BASE_VALIDATION_SCHEMA.parse(
        getQuery(event)
      );

      const rpcClient = new BitcoinRpcClient(nodeIndex);
      const response = await rpcClient.network.getPeerInfo();

      return {
        success: true,
        data: response as PeerInfo[],
      } as ApiResponse<PeerInfo[]>;
    } catch (error: any) {
      return sendErrorResponse(event, error);
    }
  }
);
