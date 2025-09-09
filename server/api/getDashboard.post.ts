import { z } from 'zod';
import { ApiResponse } from '~~/shared/types/apiResponse';
import { sendErrorResponse } from '~~/server/utils/errors';
import {
  Difficulty,
  MempoolInfo,
  NetTotals,
} from '~~/shared/types/bitcoinCore';
import type { NodeInfo } from '~~/shared/types/nodeInfo';
import { DashboardNode } from '~~/shared/types/dashboard';

// Define the POST endpoint
export default defineEventHandler(
  async (event): Promise<ApiResponse<DashboardNode>> => {
    try {
      // Parse the request body for the host (POST request)
      const { nodeIndex } = z
        .object({ nodeIndex: z.number().min(0).max(32) })
        .parse(await readBody(event));

      // Get Bitcoin node credentials for the specified host
      const bitcoinNodeCredentials = getBitcoinNodeCredentials();
      const rpc = createBitcoinRpc(bitcoinNodeCredentials[nodeIndex]);

      // Define all RPC calls to run concurrently
      const rpcCalls = [
        rpc
          .post('', {
            jsonrpc: '1.0',
            id: 'nuxt-rpc',
            method: 'getnetworkinfo',
            params: [],
          })
          .then((res) => res.data.result),
        rpc
          .post('', {
            jsonrpc: '1.0',
            id: 'nuxt-rpc',
            method: 'getblockchaininfo',
            params: [],
          })
          .then((res) => res.data.result),
      ];

      // Execute all RPC calls concurrently
      const [networkingInfoResponse, blockchainResponse] = await Promise.all(
        rpcCalls
      );

      // Construct the NodeInfo response
      const nodeInfo: DashboardNode = {
        nodeIndex: 0, // Placeholder; update based on your node tracking logic
        name:
          bitcoinNodeCredentials[nodeIndex].name ||
          bitcoinNodeCredentials[nodeIndex].host, // Use credential name or host
        host: bitcoinNodeCredentials[nodeIndex].host,
        blockchainInfo: blockchainResponse as BlockchainInfo,
        networkInfo: networkingInfoResponse as NetworkInfo,
      };

      return {
        success: true,
        data: nodeInfo,
      };
    } catch (error: any) {
      return sendErrorResponse(event, error);
    }
  }
);
