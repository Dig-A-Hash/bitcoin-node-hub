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

// Define caches outside the handler (global to the server process)
const mempoolCache = new Map<
  number,
  { height: number; txs: Map<string, any> } // nodeIndex -> { block height, txid -> mempool details }
>();
const dustMinOutCache = new Map<string, number>(); // txid -> min output in satoshis (for dust checks)
const blocksCache = new Map<number, Block[]>(); // height -> recent blocks (stable per height)

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

/**
 * Handles POST requests to fetch and process Bitcoin mempool data for visualization.
 *
 * Retrieves mempool transactions from a specified Bitcoin node, categorizes them (high-priority, low-fee, dust, ordinals, anomalous),
 * and fetches recent blocks. Uses in-memory caching to reduce node load:
 * - Caches mempool transaction details per node and block height, reusing data for known transactions and processing only new ones.
 * - Caches dust check results (minimum output satoshis) per transaction to avoid redundant `getrawtransaction` calls.
 * - Caches recent blocks per block height to avoid refetching until a new block is mined.
 *
 * Ensures fresh data on every request by fetching the latest mempool, while minimizing RPC calls through caching.
 *
 * @param event - The incoming HTTP event containing the request body with `nodeIndex`.
 * @returns A promise resolving to an `ApiResponse<VisualizerData>` containing categorized transactions, recent blocks,
 *          total transaction count, and low-priority category summaries.
 * @throws Errors are caught and returned as an `ApiResponse` with `success: false` and error details.
 */
export default defineEventHandler(
  async (event): Promise<ApiResponse<VisualizerData>> => {
    try {
      // Parse the request body for the node index
      const { nodeIndex } = AppConstants.BASE_VALIDATION_SCHEMA.parse(
        await readBody(event)
      );

      // Get Bitcoin node credentials
      const bitcoinNodeCredentials = getBitcoinNodeCredentials();
      const rpc = createBitcoinRpc(bitcoinNodeCredentials[nodeIndex]);
      const rpcClient = new BitcoinRpcClient(nodeIndex);

      // Always fetch block count first (lightweight) to check/invalidate cache
      const blockCount = await rpcClient.blockchain.getBlockCount();

      // Check mempool cache
      let cachedMempool = mempoolCache.get(nodeIndex);
      if (!cachedMempool || cachedMempool.height !== blockCount) {
        // New block or no cache: reset
        cachedMempool = { height: blockCount, txs: new Map() };
        mempoolCache.set(nodeIndex, cachedMempool);
      }

      // Fetch current mempool (lightweight, gets us fresh txs)
      const mempool = await rpcClient.mempool.getRawMempool(true);
      const totalTxCount = Object.keys(mempool).length;

      // Identify new txids (not in cache)
      const currentTxids = new Set(Object.keys(mempool));
      const cachedTxids = new Set(cachedMempool.txs.keys());
      const newTxids = [...currentTxids].filter(
        (txid) => !cachedTxids.has(txid)
      );

      // Update cache: Add new txs, remove old ones
      for (const txid of newTxids) {
        cachedMempool.txs.set(txid, mempool[txid]);
      }
      for (const txid of cachedTxids) {
        if (!currentTxids.has(txid)) {
          cachedMempool.txs.delete(txid);
          dustMinOutCache.delete(txid); // Clean up dust cache too
        }
      }

      // Categorize transactions (reuse cached for known txs, process new ones)
      const highPriority: Transaction[] = [];
      const lowFee: Transaction[] = [];
      const dust: Transaction[] = [];
      const ordinals: Transaction[] = [];
      const anomalous: Transaction[] = [];

      // Process cached transactions
      for (const [txid, details] of cachedMempool.txs) {
        if (newTxids.includes(txid)) continue; // Skip new txs for now
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
          ordinals.push(tx);
        } else if (details.depends.length > 3 || details.bip125_replaceable) {
          anomalous.push(tx);
        } else {
          highPriority.push(tx);
        }
      }

      // Fetch network info for dust threshold
      const networkInfo = await rpcClient.network.getNetworkInfo();
      const minRelayFee = networkInfo.relayfee * 1e8;
      const dustThreshold = 0.5 * minRelayFee;

      // Process new transactions (including dust checks for all txs)
      let failedTxCount = 0;
      if (newTxids.length > 0) {
        // Batch fetch getrawtransaction for new txids (dust checks)
        const batchRequests = newTxids.map((txid, index) => ({
          jsonrpc: '1.0',
          id: `nuxt-rpc-tx-${index}`,
          method: 'getrawtransaction',
          params: [txid, true],
        }));
        const responses: AxiosResponse<BitcoinRpcResponse[]> = await rpc.post(
          '',
          batchRequests
        );

        // Process batched responses
        const responseArray = Array.isArray(responses.data)
          ? responses.data
          : [];
        for (const [index, response] of responseArray.entries()) {
          const txid = newTxids[index];
          const details = mempool[txid];
          const fee = details.fees.base * 1e8;
          const feePerVbyte = fee / details.vsize;
          const tx: Transaction = {
            txid,
            fee,
            vsize: details.vsize,
            feePerVbyte,
            time: details.time,
          };

          // Categorize
          if (feePerVbyte < 2) {
            lowFee.push(tx);
          } else if (details.vsize > 10000) {
            ordinals.push(tx);
          } else if (details.depends.length > 3 || details.bip125_replaceable) {
            anomalous.push(tx);
          } else {
            highPriority.push(tx);
          }

          // Dust check
          try {
            if (response?.error) {
              console.warn(
                `Failed to fetch tx ${txid}: RPC error ${response.error.code}: ${response.error.message}`
              );
              failedTxCount++;
              continue;
            }
            if (!response?.result?.vout) {
              console.warn(
                `Invalid response for tx ${txid}: No result or vout data`
              );
              failedTxCount++;
              continue;
            }
            const outputs = response.result.vout;
            const minOutSat = Math.min(
              ...outputs.map((out) => out.value * 1e8)
            );
            dustMinOutCache.set(txid, minOutSat);
          } catch (e: any) {
            console.warn(
              `Unexpected error processing tx ${txid}: ${e.message}`
            );
            failedTxCount++;
          }
        }
        if (failedTxCount > 0) {
          console.info(
            `Dust fetching completed: ${failedTxCount}/${newTxids.length} new transactions failed`
          );
        }
      }

      // Dust checks for all transactions using cache
      for (const [txid, details] of Object.entries(mempool)) {
        const minOutSat = dustMinOutCache.get(txid);
        if (minOutSat !== undefined && minOutSat < dustThreshold) {
          const fee = details.fees.base * 1e8;
          const feePerVbyte = fee / details.vsize;
          dust.push({
            txid,
            fee,
            vsize: details.vsize,
            feePerVbyte,
            time: details.time,
          });
        }
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

      // Fetch recent blocks: Use per-height cache (stable mid-block)
      let blocks: Block[] = blocksCache.get(blockCount) || [];
      if (blocks.length === 0) {
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
        blocks = await Promise.all(blockPromises);
        blocksCache.set(blockCount, blocks);
      }

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
