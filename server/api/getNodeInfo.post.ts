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
        rpcClient.blockchain.getBlockchainInfo(),
        rpcClient.network.getNetworkInfo(),
        rpcClient.mempool.getMempoolInfo(),
        rpcClient.mining.getMiningInfo(),
        rpcClient.network.getNetTotals(),
        rpcClient.mempool.getMemoryInfo(),
        rpcClient.mining.getDifficulty(),
        rpcClient.config.getIndexInfo(),
      ]);

      const data: NodeInfo = {
        nodeIndex,
        name: rpcClient.name || rpcClient.host,
        host: rpcClient.host,
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
