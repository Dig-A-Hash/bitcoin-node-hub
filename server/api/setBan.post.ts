import { z } from 'zod';
import { ApiResponse } from '~~/shared/types/apiResponse';
import { sendErrorResponse } from '~~/server/utils/errors';

// Define the request body schema
const SetBanSchema = z.object({
  nodeIndex: z.number().min(0).max(32).optional().default(0),
  ipAddress: z.string(), // TODO: Validate IPv4 address
});

// Define the POST endpoint
export default defineEventHandler(
  async (event): Promise<ApiResponse<{ bannedIp: string }>> => {
    try {
      // Parse the request body for nodeIndex and ipAddress
      const { nodeIndex, ipAddress } = SetBanSchema.parse(
        await readBody(event)
      );

      // Get Bitcoin node credentials
      const bitcoinNodeCredentials = getBitcoinNodeCredentials();
      const rpc = createBitcoinRpc(bitcoinNodeCredentials[nodeIndex]);

      // Execute the setban RPC command
      await rpc.post('', {
        jsonrpc: '1.0',
        id: `nuxt-rpc-setban-${ipAddress}`,
        method: 'setban',
        params: [ipAddress, 'add', 3153600000], // Ban the IP indefinitely
      });

      // Construct response
      return {
        success: true,
        data: { bannedIp: ipAddress },
      } as ApiResponse<{ bannedIp: string }>;
    } catch (error: any) {
      return sendErrorResponse(event, error);
    }
  }
);
