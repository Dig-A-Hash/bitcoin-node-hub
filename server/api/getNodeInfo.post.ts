import { z } from 'zod';
import { ApiResponse } from '~~/shared/types/apiResponse';
import { sendErrorResponse } from '~~/server/utils/errors';
import {
  Difficulty,
  MempoolInfo,
  NetTotals,
} from '~~/shared/types/bitcoinCore';
import type { NodeInfo } from '~~/shared/types/nodeInfo';

// Define the POST endpoint
export default defineEventHandler(
  async (event): Promise<ApiResponse<NodeInfo>> => {
    try {
      // Parse the request body for the host (POST request)
      const { nodeIndex } = AppConstants.BASE_VALIDATION_SCHEMA.parse(
        await readBody(event)
      );

      // Get Bitcoin node credentials for the specified host
      const bitcoinNodeCredentials = getBitcoinNodeCredentials();
      const rpc = createBitcoinRpc(bitcoinNodeCredentials[nodeIndex]);

      // Define all RPC calls to run concurrently
      const rpcCalls = [
        rpc.post('', {
          jsonrpc: '1.0',
          id: 'nuxt-rpc-blockchain',
          method: 'getblockchaininfo',
          params: [],
        }),
        rpc.post('', {
          jsonrpc: '1.0',
          id: 'nuxt-rpc-network',
          method: 'getnetworkinfo',
          params: [],
        }),
        rpc.post('', {
          jsonrpc: '1.0',
          id: 'nuxt-rpc-mempool',
          method: 'getmempoolinfo',
          params: [],
        }),
        rpc.post('', {
          jsonrpc: '1.0',
          id: 'nuxt-rpc-mining',
          method: 'getmininginfo',
          params: [],
        }),
        rpc.post('', {
          jsonrpc: '1.0',
          id: 'nuxt-rpc-nettotals',
          method: 'getnettotals',
          params: [],
        }),
        rpc.post('', {
          jsonrpc: '1.0',
          id: 'nuxt-rpc-memory',
          method: 'getmemoryinfo',
          params: [],
        }),
        rpc.post('', {
          jsonrpc: '1.0',
          id: 'nuxt-rpc-difficulty',
          method: 'getdifficulty',
          params: [],
        }),
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
      const [
        blockchainResponse,
        networkResponse,
        mempoolResponse,
        miningResponse,
        netTotalsResponse,
        memoryResponse,
        difficultyResponse,
        indexInfoResponse,
      ] = await Promise.all(rpcCalls);

      // Construct the NodeInfo response
      const nodeInfo: NodeInfo = {
        nodeIndex,
        name: bitcoinNodeCredentials[0].name || bitcoinNodeCredentials[0].host,
        host: bitcoinNodeCredentials[0].host,
        blockchainInfo: blockchainResponse.data.result as BlockchainInfo,
        networkInfo: networkResponse.data.result as NetworkInfo,
        mempoolInfo: mempoolResponse.data.result as MempoolInfo,
        miningInfo: miningResponse.data.result as MiningInfo,
        netTotals: netTotalsResponse.data.result as NetTotals,
        memoryInfo: memoryResponse.data.result as MemoryInfo,
        difficulty: difficultyResponse.data.result as Difficulty,
        indexInfo: indexInfoResponse as IndexInfo,
      };

      return {
        success: true,
        data: nodeInfo,
      } as ApiResponse<NodeInfo>;
    } catch (error: any) {
      return sendErrorResponse(event, error);
    }
  }
);
