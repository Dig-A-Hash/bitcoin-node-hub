import { z } from 'zod';

export default defineEventHandler(
  async (event): Promise<ApiResponse<{ ip: string }>> => {
    try {
      const { nodeIndex, ipAddress } =
        AppConstants.BASE_VALIDATION_SCHEMA.extend({
          ipAddress: z.string(), // TODO: Validate IPv4 address
        }).parse(await readBody(event));

      const rpcClient = new BitcoinRpcClient(nodeIndex);
      await rpcClient.ban.removeBan(ipAddress);

      return {
        success: true,
        data: { ip: ipAddress },
      };
    } catch (error: any) {
      return sendErrorResponse(event, error);
    }
  }
);
