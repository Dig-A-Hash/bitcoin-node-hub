import { ApiResponse } from '~~/shared/types/apiResponse';
import { sendErrorResponse } from '~~/server/utils/errors';
import { BitcoinRpcClient } from '~~/server/utils/bitcoinRpcClient';

export default defineEventHandler(
  async (event): Promise<ApiResponse<DashboardNode>> => {
    try {
      const { nodeIndex } = AppConstants.BASE_VALIDATION_SCHEMA.parse(
        await readBody(event)
      );

      const rpcClient = new BitcoinRpcClient(nodeIndex);

      const [blockchainInfo, networkInfo, indexInfo] = await Promise.all([
        rpcClient.getBlockchainInfo(),
        rpcClient.getNetworkInfo(),
        rpcClient.getIndexInfo(),
      ]);

      const credentials = getBitcoinNodeCredentials();
      const data: DashboardNode = {
        nodeIndex,
        name: credentials[nodeIndex].name || credentials[nodeIndex].host,
        host: credentials[nodeIndex].host,
        blockchainInfo,
        networkInfo,
        indexInfo,
      };

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return sendErrorResponse(event, error);
    }
  }
);
