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

      const [blockchainInfo, networkInfo, indexInfo, upTime] =
        await Promise.all([
          rpcClient.blockchain.getBlockchainInfo(),
          rpcClient.network.getNetworkInfo(),
          rpcClient.config.getIndexInfo(),
          rpcClient.network.getUptime(),
        ]);

      const data: DashboardNode = {
        nodeIndex,
        name: rpcClient.name || rpcClient.host,
        host: rpcClient.host,
        blockchainInfo,
        networkInfo,
        indexInfo,
        upTime,
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
