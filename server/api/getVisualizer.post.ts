import { z } from 'zod';
import { ApiResponse } from '~~/shared/types/apiResponse';
import { sendErrorResponse } from '~~/server/utils/errors';
import {
  Transaction,
  Block,
  VisualizerData,
} from '~~/shared/types/bitcoinCore';

// Define the POST endpoint
export default defineEventHandler(
  async (event): Promise<ApiResponse<VisualizerData>> => {
    try {
      // Parse the request body for the node index (optional, default to 0)
      const { nodeIndex } = z
        .object({ nodeIndex: z.number().min(0).max(32).optional().default(0) })
        .parse(await readBody(event));

      // Get Bitcoin node credentials
      const bitcoinNodeCredentials = getBitcoinNodeCredentials();
      const rpc = createBitcoinRpc(bitcoinNodeCredentials[nodeIndex]);

      // Define RPC calls for mempool and blocks
      const rpcCalls = [
        // Fetch mempool transactions
        rpc.post('', {
          jsonrpc: '1.0',
          id: 'nuxt-rpc-mempool',
          method: 'getrawmempool',
          params: [true],
        }),
        // Fetch block count
        rpc.post('', {
          jsonrpc: '1.0',
          id: 'nuxt-rpc-blockcount',
          method: 'getblockcount',
          params: [],
        }),
      ];

      // Execute RPC calls concurrently
      const [mempoolResponse, blockCountResponse] = await Promise.all(rpcCalls);

      // Process mempool data
      const mempool: {
        [txid: string]: { fees: { base: number }; vsize: number };
      } = mempoolResponse.data.result;
      const totalTxCount = Object.keys(mempool).length; // Total number of transactions in mempool
      const transactions: Transaction[] = Object.entries(mempool)
        .map(([txid, details]) => ({
          txid,
          fee: details.fees.base * 1e8, // Convert BTC to satoshis
          vsize: details.vsize,
          feePerVbyte: (details.fees.base * 1e8) / details.vsize,
        }))
        .sort((a, b) => b.feePerVbyte - a.feePerVbyte) // Sort by feePerVbyte descending
        .slice(0, 1722) as Transaction[]; // Limit to top 1600

      // Fetch recent blocks (up to 5)
      const blockCount: number = blockCountResponse.data.result;
      const blockPromises = [];
      for (let i = 0; i < 5 && blockCount - i > 0; i++) {
        blockPromises.push(
          // Fetch block hash
          rpc
            .post('', {
              jsonrpc: '1.0',
              id: `nuxt-rpc-blockhash-${i}`,
              method: 'getblockhash',
              params: [blockCount - i],
            })
            .then(async (hashResponse) => {
              const blockHash: string = hashResponse.data.result;
              // Fetch block details
              const blockResponse = await rpc.post('', {
                jsonrpc: '1.0',
                id: `nuxt-rpc-block-${i}`,
                method: 'getblock',
                params: [blockHash],
              });
              const block: { hash: string; height: number } =
                blockResponse.data.result;
              return { hash: block.hash, height: block.height } as Block;
            })
        );
      }
      const blocks: Block[] = await Promise.all(blockPromises);

      // Construct response
      const visualizerData: VisualizerData = {
        transactions,
        blocks,
        totalTxCount, // Add total transaction count
      };

      return {
        success: true,
        data: visualizerData,
      } as ApiResponse<VisualizerData>;
    } catch (error: any) {
      return sendErrorResponse(event, error);
    }
  }
);
