export default defineEventHandler(
  async (event): Promise<ApiResponse<DashboardNode>> => {
    try {
      const { nodeIndex } = AppConstants.BASE_VALIDATION_SCHEMA.parse(
        await readBody(event)
      );

      const rpcClient = new BitcoinRpcClient(nodeIndex);

      const [blockchainInfo, networkInfo, indexInfo, upTime, netTotals] =
        await Promise.all([
          rpcClient.blockchain.getBlockchainInfo(),
          rpcClient.network.getNetworkInfo(),
          rpcClient.config.getIndexInfo(),
          rpcClient.network.getUptime(),
          rpcClient.network.getNetTotals(),
        ]);

      const data: DashboardNode = {
        nodeIndex,
        name: rpcClient.name || rpcClient.host,
        host: rpcClient.host,
        blockchainInfo,
        networkInfo,
        indexInfo,
        upTime,
        netTotals,
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
