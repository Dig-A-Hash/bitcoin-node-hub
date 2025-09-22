import { z } from 'zod';
import { ApiResponse } from '~~/shared/types/apiResponse';
import { sendErrorResponse } from '~~/server/utils/errors';
import {
  Transaction,
  Block,
  VisualizerData,
} from '~~/shared/types/bitcoinCore';
import { AppConstants } from '~~/server/utils/constants';
import { AxiosResponse } from 'axios';

// Define low-priority transaction categories
interface LowPriorityCategory {
  count: number;
  totalVsize: number;
  avgFeePerVbyte: number;
  exampleTxid?: string;
}

// Define structure of batched RPC response
interface BitcoinRpcResponse {
  id: string;
  result: { vout: { value: number; scriptPubKey: { type: string } }[] } | null;
  error?: { code: number; message: string };
}

// Define the POST endpoint
export default defineEventHandler(
  async (event): Promise<ApiResponse<VisualizerData>> => {
    try {
      // Parse the request body for the node index
      const { nodeIndex } = z
        .object({
          nodeIndex: z.number().min(0).max(AppConstants.MAX_NODES),
        })
        .parse(await readBody(event));

      // Get Bitcoin node credentials
      const bitcoinNodeCredentials = getBitcoinNodeCredentials();
      const rpc = createBitcoinRpc(bitcoinNodeCredentials[nodeIndex]);
      const rpcClient = new BitcoinRpcClient(nodeIndex);

      // Fetch mempool, block count, and network info concurrently
      const [mempool, blockCount, networkInfo] = await Promise.all([
        rpcClient.mempool.getRawMempool(true),
        rpcClient.blockchain.getBlockCount(),
        rpcClient.network.getNetworkInfo(),
      ]);

      // Process mempool data
      const totalTxCount = Object.keys(mempool).length;

      // Categorize transactions
      const highPriority: Transaction[] = [];
      const lowFee: Transaction[] = [];
      const dust: Transaction[] = [];
      const ordinals: Transaction[] = [];
      const anomalous: Transaction[] = [];

      for (const [txid, details] of Object.entries(mempool)) {
        const fee = details.fees.base * 1e8; // Convert BTC to satoshis
        const feePerVbyte = fee / details.vsize;
        const tx: Transaction = {
          txid,
          fee,
          vsize: details.vsize,
          feePerVbyte,
          time: details.time,
        };

        // Heuristics for categorization
        if (feePerVbyte < 2) {
          lowFee.push(tx);
        } else if (details.vsize > 10000) {
          // Large vsize suggests potential ordinal/inscription
          // Ordinal transactions often include large amounts of data
          ordinals.push(tx);
        } else if (details.depends.length > 3 || details.bip125_replaceable) {
          // Long dependency chains or RBF
          anomalous.push(tx);
        } else {
          highPriority.push(tx);
        }
      }

      // Calculate dynamic dust threshold
      const minRelayFee = networkInfo.relayfee * 1e8;
      const dustThreshold = 0.5 * minRelayFee;

      // Use all mempool transactions for dust checking
      const sampledTxs = Object.entries(mempool).map(([txid, details]) => ({
        txid,
        fee: details.fees.base * 1e8,
        vsize: details.vsize,
        feePerVbyte: (details.fees.base * 1e8) / details.vsize,
        time: details.time,
      }));

      // Batch fetch transaction details for all mempool transactions
      const batchRequests = sampledTxs.map((tx, index) => ({
        jsonrpc: '1.0',
        id: `nuxt-rpc-tx-${index}`,
        method: 'getrawtransaction',
        params: [tx.txid, true],
      }));
      const responses: AxiosResponse<BitcoinRpcResponse[]> = await rpc.post(
        '',
        batchRequests
      );

      // Process batched responses for dust with improved error handling
      let failedTxCount = 0;
      const responseArray = Array.isArray(responses.data) ? responses.data : [];
      if (!responseArray.length) {
        console.warn(`No valid responses received from batched RPC call`);
      }
      for (const [index, response] of responseArray.entries()) {
        try {
          if (!response) {
            console.warn(
              `No response for tx ${
                sampledTxs[index]?.txid ?? 'unknown'
              } at index ${index}: Response is undefined`
            );
            failedTxCount++;
            continue;
          }
          if (response.error) {
            console.warn(
              `Failed to fetch tx ${
                sampledTxs[index]?.txid ?? 'unknown'
              }: RPC error ${response.error.code}: ${response.error.message}`
            );
            failedTxCount++;
            continue;
          }
          if (!response.result?.vout) {
            console.warn(
              `Invalid response for tx ${
                sampledTxs[index]?.txid ?? 'unknown'
              }: No result or vout data`
            );
            failedTxCount++;
            continue;
          }
          const outputs = response.result.vout;

          if (outputs.some((out) => out.value * 1e8 < dustThreshold)) {
            dust.push(sampledTxs[index]);
          }
        } catch (e: any) {
          console.warn(
            `Unexpected error processing tx ${
              sampledTxs[index]?.txid ?? 'unknown'
            }: ${e.message}`
          );
          failedTxCount++;
        }
      }
      if (failedTxCount > 0) {
        console.info(
          `Dust checking completed: ${failedTxCount}/${sampledTxs.length} transactions failed`
        );
      }

      // Sort high-priority txs by feePerVbyte (descending) then time (newest first)
      const sortedHighPriority = highPriority
        .sort((a, b) => {
          if (b.feePerVbyte !== a.feePerVbyte) {
            return b.feePerVbyte - a.feePerVbyte; // Sort by feePerVbyte descending
          }
          return b.time - a.time; // Within same fee, sort by time descending
        })
        .slice(0, AppConstants.MAX_VIZ_TX);

      // Summarize low-priority categories
      const summarizeCategory = (txs: Transaction[]): LowPriorityCategory => ({
        count: txs.length,
        totalVsize: txs.reduce((sum, tx) => sum + tx.vsize, 0),
        avgFeePerVbyte:
          txs.length > 0
            ? txs.reduce((sum, tx) => sum + tx.feePerVbyte, 0) / txs.length
            : 0,
        exampleTxid: txs[0]?.txid,
      });

      const lowPriorityCategories = {
        lowFee: summarizeCategory(lowFee),
        dust: summarizeCategory(dust),
        ordinals: summarizeCategory(ordinals),
        anomalous: summarizeCategory(anomalous),
      };

      // Fetch recent blocks (up to 5) with timestamps
      const blockPromises = [];
      for (let i = 0; i < 5 && blockCount - i > 0; i++) {
        blockPromises.push(
          rpcClient.blockchain
            .getBlockHash(blockCount - i)
            .then(async (getBlockHashResponse) => {
              const block = await rpcClient.blockchain.getBlock(
                getBlockHashResponse
              );
              return {
                hash: block.hash,
                height: block.height,
                time: block.time,
              } as Block;
            })
        );
      }
      const blocks: Block[] = await Promise.all(blockPromises);

      // Construct response
      const visualizerData: VisualizerData = {
        transactions: sortedHighPriority,
        blocks,
        totalTxCount,
        lowPriorityCategories,
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
