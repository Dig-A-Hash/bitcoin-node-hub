import { ApiResponse } from '~~/shared/types/apiResponse';
import { sendErrorResponse } from '~~/server/utils/errors';
import type { NodeInfo } from '~~/shared/types/nodeInfo';
import { BitcoinRpcClient } from '~~/server/utils/bitcoinRpcClient';

export default defineEventHandler(
  async (event): Promise<ApiResponse<NodeInfo>> => {
    try {
      const { nodeIndex } = AppConstants.BASE_VALIDATION_SCHEMA.parse(
        await readBody(event)
      );

      const rpcClient = new BitcoinRpcClient(nodeIndex);

      const [
        blockchainInfo,
        networkInfo,
        mempoolInfo,
        miningInfo,
        netTotals,
        memoryInfo,
        difficulty,
        indexInfo,
      ] = await Promise.all([
        rpcClient.getBlockchainInfo(),
        rpcClient.getNetworkInfo(),
        rpcClient.getMempoolInfo(),
        rpcClient.getMiningInfo(),
        rpcClient.getNetTotals(),
        rpcClient.getMemoryInfo(),
        rpcClient.getDifficulty(),
        rpcClient.getIndexInfo(),
      ]);

      const credentials = getBitcoinNodeCredentials();
      const data: NodeInfo = {
        nodeIndex,
        name: credentials[nodeIndex].name || credentials[nodeIndex].host,
        host: credentials[nodeIndex].host,
        blockchainInfo,
        networkInfo,
        mempoolInfo,
        miningInfo,
        netTotals,
        memoryInfo,
        difficulty,
        indexInfo,
      };

      return {
        success: true,
        data,
      } as ApiResponse<NodeInfo>;
    } catch (error: any) {
      return sendErrorResponse(event, error);
    }
  }
);
