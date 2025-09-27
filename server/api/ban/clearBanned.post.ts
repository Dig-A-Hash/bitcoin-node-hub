export default defineEventHandler(async (event): Promise<ApiResponse<{}>> => {
  try {
    const { nodeIndex } = AppConstants.BASE_VALIDATION_SCHEMA.parse(
      await readBody(event)
    );

    const rpcClient = new BitcoinRpcClient(nodeIndex);
    await rpcClient.ban.clearBanned();

    return {
      success: true,
      data: {},
    };
  } catch (error: any) {
    return sendErrorResponse(event, error);
  }
});
