export default defineEventHandler(
  async (event): Promise<ApiResponse<{ ip: string }>> => {
    try {
      const { nodeIndex, ipAddress, banTime } =
        AppConstants.BASE_VALIDATION_SCHEMA.extend({
          ipAddress: z.string(), // TODO: Validate IPv4 address
          banTime: z.number().min(0).max(3155760001), // 100 years + 1 sec
        }).parse(await readBody(event));

      const rpcClient = new BitcoinRpcClient(nodeIndex);
      await rpcClient.ban.setBan(ipAddress, banTime);

      return {
        success: true,
        data: { ip: ipAddress },
      };
    } catch (error: any) {
      return sendErrorResponse(event, error);
    }
  }
);
