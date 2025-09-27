export default defineEventHandler(
  async (event): Promise<ApiResponse<BanEntry[]>> => {
    try {
      const { nodeIndex } = AppConstants.BASE_VALIDATION_SCHEMA.parse(
        getQuery(event)
      );
      const rpcClient = new BitcoinRpcClient(nodeIndex);
      const response = await rpcClient.ban.listBanned();

      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return sendErrorResponse(event, error);
    }
  }
);
