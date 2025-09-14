import { z } from 'zod';
import { ApiResponse } from '~~/shared/types/apiResponse';
import { sendErrorResponse } from '~~/server/utils/errors';
import {
  BlockchainInfo,
  IndexInfo,
  NetworkInfo,
} from '~~/shared/types/bitcoinCore';

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
        rpc
          .post('', {
            jsonrpc: '1.0',
            id: 'nuxt-rpc',
            method: 'getindexinfo',
            params: [],
          })
          .then((res) => res.data.result),
      ];

      // Execute all RPC calls concurrently
      const [networkingInfoResponse, blockchainResponse, indexInfoResponse] =
        await Promise.all(rpcCalls);

      // Construct the NodeInfo response
      const nodeInfo: DashboardNode = {
        nodeIndex: nodeIndex,
        name:
          bitcoinNodeCredentials[nodeIndex].name ||
          bitcoinNodeCredentials[nodeIndex].host,
        host: bitcoinNodeCredentials[nodeIndex].host,
        blockchainInfo: blockchainResponse as BlockchainInfo,
        networkInfo: networkingInfoResponse as NetworkInfo,
        indexInfo: indexInfoResponse as IndexInfo,
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
