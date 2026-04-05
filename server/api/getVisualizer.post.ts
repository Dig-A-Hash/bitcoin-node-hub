// Define type for cached mempool structure
interface CachedMempool {
  height: number;
  txs: Map<string, MempoolTransactionInfo>;
}

// Lightweight data stored for low-priority transactions (only summary fields needed)
interface LowPriorityTxData {
  vsize: number;
  feePerVbyte: number;
}

// Categorized data cache — highPriority as full Transaction[], low-priority as lightweight Maps
interface CategorizedData {
  highPriority: Transaction[];
  lowFee: Map<string, LowPriorityTxData>;
  ordinals: Map<string, LowPriorityTxData>;
  anomalous: Map<string, LowPriorityTxData>;
  minCutoffFee: number; // Fee floor of the lowest-fee tx in the bounded highPriority buffer
}

// Define caches outside the handler (global to the server process)
const mempoolCache = new Map<number, CachedMempool>();
const blocksCache = new Map<number, Block[]>();
const categoriesCache = new Map<string, CategorizedData>();

// Define low-priority transaction categories (response shape)
interface LowPriorityCategory {
  count: number;
  totalVsize: number;
  avgFeePerVbyte: number;
  exampleTxid?: string;
}

// Define the category keys as a type
type TransactionCategory = 'highPriority' | 'lowFee' | 'ordinals' | 'anomalous';

interface BitcoinRpcError {
  code: number;
  message: string;
}

interface BitcoinRpcResponse<T> {
  id: string;
  result: T | null;
  error?: BitcoinRpcError | null;
}

interface GetMempoolEntryResult extends MempoolTransactionInfo { }

interface RawMempoolVerbose {
  [txid: string]: MempoolTransactionInfo;
}

/**
 * Builds a Transaction object from mempool details.
 * @param txid - The transaction ID.
 * @param details - The mempool details for the transaction.
 * @returns A Transaction object.
 */
function buildTransaction(
  txid: string,
  details: MempoolTransactionInfo
): Transaction {
  const fee = details.fees.base * 1e8; // Convert BTC to satoshis
  const feePerVbyte = fee / details.vsize;
  return {
    txid,
    fee,
    vsize: details.vsize,
    feePerVbyte,
    time: details.time,
  };
}

/**
 * Categorizes a transaction based on heuristics.
 * @param tx - The transaction to categorize.
 * @param details - The mempool details for the transaction.
 * @returns The category name for the transaction.
 */
function categorizeTransaction(
  tx: Transaction,
  details: MempoolTransactionInfo
): TransactionCategory {
  if (tx.feePerVbyte < 2) {
    return 'lowFee';
  } else if (details.vsize > 10000) {
    return 'ordinals';
  } else if (details.depends.length > 3 || details.bip125_replaceable) {
    return 'anomalous';
  }
  return 'highPriority';
}

/**
 * Fetches mempool entry details in chunks via batch RPC.
 * Used by both cold-start and warm-start paths to avoid oversized single requests.
 * @param txids - Array of transaction IDs to fetch.
 * @param rpcClient - The Bitcoin RPC client.
 * @param cachedMempool - The cached mempool to populate with results.
 */
async function batchFetchMempoolEntries(
  txids: string[],
  rpcClient: BitcoinRpcClient,
  cachedMempool: CachedMempool
): Promise<void> {
  const chunkSize = AppConstants.BATCH_CHUNK_SIZE;
  for (let i = 0; i < txids.length; i += chunkSize) {
    const chunk = txids.slice(i, i + chunkSize);
    const batchRequests = chunk.map((txid, index) => ({
      jsonrpc: '1.0',
      id: `getmempoolentry-${i + index}`,
      method: 'getmempoolentry',
      params: [txid],
    }));

    const responseArray: BitcoinRpcResponse<GetMempoolEntryResult>[] =
      await rpcClient.batchRpc(batchRequests);

    for (const [index, response] of responseArray.entries()) {
      const txid = chunk[index];
      if (!txid) continue;
      try {
        if (response?.error) {
          console.warn(
            `Failed to fetch mempool entry for ${txid}: RPC error ${response.error.code}: ${response.error.message}`
          );
          continue;
        }
        if (!response?.result) {
          console.warn(
            `Invalid response for mempool entry ${txid}: No result`
          );
          continue;
        }
        cachedMempool.txs.set(txid, response.result);
      } catch (e: any) {
        console.warn(
          `Unexpected error processing mempool entry ${txid}: ${e.message}`
        );
      }
    }
  }
}

/**
 * Gets and updates the mempool cache for the given node and block count.
 * On cold starts (new height), fetches txid list and batch-fetches details in chunks.
 * On warm starts, fetches txids and batch-fetches new entries in chunks.
 * @param nodeIndex - The Bitcoin node index.
 * @param blockCount - The current block count.
 * @param rpcClient - The Bitcoin RPC client.
 * @returns An object with the cached mempool, current txids, new txids, and removed txids.
 */
async function getAndUpdateMempoolCache(
  nodeIndex: number,
  blockCount: number,
  rpcClient: BitcoinRpcClient
) {
  let cachedMempool = mempoolCache.get(nodeIndex);
  const isNewHeight = !cachedMempool || cachedMempool.height !== blockCount;
  if (isNewHeight) {
    // New block: reset caches
    cachedMempool = {
      height: blockCount,
      txs: new Map<string, MempoolTransactionInfo>(),
    };
    mempoolCache.set(nodeIndex, cachedMempool);
    const cacheKey = `${nodeIndex}_${blockCount}`;
    categoriesCache.delete(cacheKey);

    // Cold start: Fetch txid list (lightweight), then batch-fetch details in chunks
    const mempoolTxids: string[] = (await rpcClient.mempool.getRawMempool(
      false
    )) as unknown as string[];

    await batchFetchMempoolEntries(mempoolTxids, rpcClient, cachedMempool);

    const currentTxids = new Set(mempoolTxids);
    const newTxids: string[] = mempoolTxids;
    const removedTxids: string[] = [];

    return { cachedMempool, currentTxids, newTxids, removedTxids };
  } else {
    // Warm start: Fetch current txids (non-verbose, fast)
    const mempoolTxids: string[] = (await rpcClient.mempool.getRawMempool(
      false
    )) as unknown as string[];

    const currentTxids = new Set(mempoolTxids);
    const cachedTxids = new Set(cachedMempool?.txs.keys());
    const newTxids = [...currentTxids].filter((txid) => !cachedTxids.has(txid));
    const removedTxids = [...cachedTxids].filter(
      (txid) => !currentTxids.has(txid)
    );

    // Batch-fetch details for new txs in chunks
    if (newTxids.length > 0) {
      await batchFetchMempoolEntries(newTxids, rpcClient, cachedMempool!);
    }

    // Clean up removed txs
    for (const txid of removedTxids) {
      cachedMempool?.txs.delete(txid);
    }

    return { cachedMempool, currentTxids, newTxids, removedTxids };
  }
}

/**
 * Processes new transactions: categorizes them into highPriority (Transaction[]) or low-priority (Maps).
 * Skips high-priority txs below the cutoff fee when the buffer is full.
 * @param newTxids - Array of new transaction IDs.
 * @param cachedMempool - The cached mempool data.
 * @param categories - The current categorized data to update.
 * @returns The number of failed transactions during processing.
 */
function processNewTransactions(
  newTxids: string[],
  cachedMempool: CachedMempool,
  categories: CategorizedData
): number {
  let failedTxCount = 0;
  if (newTxids.length === 0) return failedTxCount;

  for (const txid of newTxids) {
    const details = cachedMempool.txs.get(txid);
    if (!details) {
      failedTxCount++;
      continue;
    }
    const tx = buildTransaction(txid, details);
    const category = categorizeTransaction(tx, details);

    if (category === 'highPriority') {
      // Skip if below cutoff and buffer is full
      if (
        categories.highPriority.length >= AppConstants.HIGH_PRIORITY_BUFFER &&
        tx.feePerVbyte < categories.minCutoffFee
      ) {
        continue;
      }
      categories.highPriority.push(tx);
    } else {
      categories[category].set(txid, {
        vsize: tx.vsize,
        feePerVbyte: tx.feePerVbyte,
      });
    }
  }

  return failedTxCount;
}

/**
 * Sorts high-priority transactions by feePerVbyte (desc) then time (desc),
 * trims to the buffer limit, and returns the cutoff fee for future filtering.
 * @param highPriority - Array of high-priority transactions.
 * @returns Sorted/trimmed array and the minimum fee of the buffer.
 */
function trimHighPriorityBuffer(
  highPriority: Transaction[]
): { trimmed: Transaction[]; minCutoffFee: number } {
  const sorted = highPriority
    .sort((a, b) => {
      if (b.feePerVbyte !== a.feePerVbyte) {
        return b.feePerVbyte - a.feePerVbyte; // Sort by feePerVbyte descending
      }
      return b.time - a.time; // Within same fee, sort by time descending
    })
    .slice(0, AppConstants.HIGH_PRIORITY_BUFFER);

  const minCutoffFee =
    sorted.length >= AppConstants.HIGH_PRIORITY_BUFFER
      ? sorted[sorted.length - 1]!.feePerVbyte
      : 0;

  return { trimmed: sorted, minCutoffFee };
}

/**
 * Summarizes a low-priority category from its lightweight Map data.
 * @param txs - Map of txid to lightweight tx data.
 * @returns A LowPriorityCategory summary.
 */
function summarizeLowPriorityCategory(
  txs: Map<string, LowPriorityTxData>
): LowPriorityCategory {
  let totalVsize = 0;
  let sumFeePerVbyte = 0;
  let exampleTxid: string | undefined;

  for (const [txid, data] of txs) {
    totalVsize += data.vsize;
    sumFeePerVbyte += data.feePerVbyte;
    if (!exampleTxid) exampleTxid = txid;
  }

  return {
    count: txs.size,
    totalVsize,
    avgFeePerVbyte: txs.size > 0 ? sumFeePerVbyte / txs.size : 0,
    exampleTxid,
  };
}

/**
 * Gets recent blocks, using cache if available.
 * @param blockCount - The current block count.
 * @param rpcClient - The Bitcoin RPC client.
 * @returns Array of recent Block objects.
 */
async function getRecentBlocks(
  blockCount: number,
  rpcClient: BitcoinRpcClient
): Promise<Block[]> {
  let blocks: Block[] = blocksCache.get(blockCount) || [];
  if (blocks.length === 0) {
    const blockPromises = [];
    for (let i = 0; i < 5 && blockCount - i > 0; i++) {
      blockPromises.push(
        rpcClient.blockchain
          .getBlockHash(blockCount - i)
          .then(async (getBlockHashResponse: string) => {
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
  return blocks;
}

/**
 * Handles POST requests to fetch and process Bitcoin mempool data for visualization.
 *
 * Retrieves mempool transactions from a specified Bitcoin node, categorizes them (high-priority, low-fee, ordinals, anomalous),
 * and fetches recent blocks. Uses in-memory caching to reduce node load:
 * - Caches mempool transaction details per node and block height, fetching full verbose on cold starts and deltas on warm starts.
 * - Caches categorized transactions per block height to apply deltas incrementally.
 * - Caches recent blocks per block height.
 *
 * Ensures fresh data on every request by fetching txids (warm) or full mempool (cold), while minimizing RPC calls through caching.
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
      const rpcClient = new BitcoinRpcClient(nodeIndex);

      // Always fetch block count first (lightweight) to check/invalidate cache
      const blockCount = await rpcClient.blockchain.getBlockCount();

      // Get or update mempool cache (txids and new details)
      const { cachedMempool, currentTxids, newTxids, removedTxids } =
        await getAndUpdateMempoolCache(nodeIndex, blockCount, rpcClient);
      const totalTxCount = currentTxids.size;

      // Load or initialize categories, apply removals
      const cacheKey = `${nodeIndex}_${blockCount}`;
      let categories: CategorizedData;
      if (categoriesCache.has(cacheKey)) {
        categories = categoriesCache.get(cacheKey)!;
        // Apply removals
        if (removedTxids.length > 0) {
          const removedSet = new Set(removedTxids);
          categories.highPriority = categories.highPriority.filter(
            (tx) => !removedSet.has(tx.txid)
          );
          // O(1) removal from low-priority Maps
          for (const txid of removedTxids) {
            categories.lowFee.delete(txid);
            categories.ordinals.delete(txid);
            categories.anomalous.delete(txid);
          }
        }
      } else {
        categories = {
          highPriority: [],
          lowFee: new Map(),
          ordinals: new Map(),
          anomalous: new Map(),
          minCutoffFee: 0,
        };
      }

      // Process new transactions and update categories
      processNewTransactions(newTxids, cachedMempool!, categories);

      // Trim highPriority buffer and update cutoff fee
      const { trimmed, minCutoffFee } = trimHighPriorityBuffer(
        categories.highPriority
      );
      categories.highPriority = trimmed;
      categories.minCutoffFee = minCutoffFee;

      // Cache the updated categories
      categoriesCache.set(cacheKey, categories);

      // Slice for response (buffer may be up to HIGH_PRIORITY_BUFFER, display limited to MAX_VIZ_TX)
      const sortedHighPriority = categories.highPriority.slice(
        0,
        AppConstants.MAX_VIZ_TX
      );

      // Summarize low-priority categories
      const lowPriorityCategories = {
        lowFee: summarizeLowPriorityCategory(categories.lowFee),
        ordinals: summarizeLowPriorityCategory(categories.ordinals),
        anomalous: summarizeLowPriorityCategory(categories.anomalous),
      };

      // Fetch recent blocks
      const blocks = await getRecentBlocks(blockCount, rpcClient);

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
