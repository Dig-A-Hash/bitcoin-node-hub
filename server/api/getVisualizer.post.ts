// Define type for cached mempool structure
interface CachedMempool {
  height: number;
  txs: Map<string, MempoolTransactionInfo>;
}

// Define caches outside the handler (global to the server process)
const mempoolCache = new Map<number, CachedMempool>();
const blocksCache = new Map<number, Block[]>();
const categoriesCache = new Map<
  string,
  { [key in TransactionCategory]: Transaction[] }
>();

// Define low-priority transaction categories
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

interface GetMempoolEntryResult extends MempoolTransactionInfo {}

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
 * Gets and updates the mempool cache for the given node and block count.
 * On cold starts (new height), fetches full verbose mempool.
 * On warm starts, fetches txids and verbose details for new txs only.
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
    // Also reset categories for new height
    const cacheKey = `${nodeIndex}_${blockCount}`;
    categoriesCache.delete(cacheKey);

    // Cold start: Fetch full verbose mempool (single RPC call) - simdjson integration in BitcoinRpcClient speeds up parse here
    const mempool: RawMempoolVerbose = await rpcClient.mempool.getRawMempool(
      true
    );

    // Populate cache from full mempool
    for (const [txid, details] of Object.entries(mempool)) {
      cachedMempool.txs.set(txid, details);
    }

    const currentTxids = new Set(Object.keys(mempool));
    const newTxids: string[] = [...currentTxids]; // All are new on cold start
    const removedTxids: string[] = []; // None on cold start

    return { cachedMempool, currentTxids, newTxids, removedTxids };
  } else {
    // Warm start: Fetch current txids (non-verbose, fast)
    const mempoolTxids: string[] = (await rpcClient.mempool.getRawMempool(
      false
    )) as unknown as string[];

    // Identify new and removed txids
    const currentTxids = new Set(mempoolTxids);
    const cachedTxids = new Set(cachedMempool?.txs.keys());
    const newTxids = [...currentTxids].filter((txid) => !cachedTxids.has(txid));
    const removedTxids = [...cachedTxids].filter(
      (txid) => !currentTxids.has(txid)
    );

    // Fetch verbose details for new txs via batch getmempoolentry - simdjson in batchRpc speeds up parse
    if (newTxids.length > 0) {
      const batchRequests = newTxids.map((txid, index) => ({
        jsonrpc: '1.0',
        id: `getmempoolentry-${index}`,
        method: 'getmempoolentry',
        params: [txid],
      }));
      const responseArray: BitcoinRpcResponse<GetMempoolEntryResult>[] =
        await rpcClient.batchRpc(batchRequests);

      for (const [index, response] of responseArray.entries()) {
        const txid = newTxids[index];
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
          cachedMempool?.txs.set(txid, response.result);
        } catch (e: any) {
          console.warn(
            `Unexpected error processing mempool entry ${txid}: ${e.message}`
          );
        }
      }
    }

    // Clean up removed txs
    for (const txid of removedTxids) {
      cachedMempool?.txs.delete(txid);
    }

    return { cachedMempool, currentTxids, newTxids, removedTxids };
  }
}

/**
 * Processes new transactions: categorizes them.
 * @param newTxids - Array of new transaction IDs.
 * @param cachedMempool - The cached mempool data.
 * @param categories - The current categories object to update.
 * @returns The number of failed transactions during processing.
 */
async function processNewTransactions(
  newTxids: string[],
  cachedMempool: CachedMempool,
  categories: { [key in TransactionCategory]: Transaction[] }
): Promise<number> {
  let failedTxCount = 0;
  if (newTxids.length === 0) return failedTxCount;

  // Categorize new txs using their details
  for (const txid of newTxids) {
    const details = cachedMempool.txs.get(txid);
    if (!details) {
      failedTxCount++;
      continue;
    }
    const tx = buildTransaction(txid, details);
    const category = categorizeTransaction(tx, details);
    categories[category].push(tx);
  }

  return failedTxCount;
}

/**
 * Sorts high-priority transactions by feePerVbyte (desc) then time (desc), and slices to max limit.
 * @param highPriority - Array of high-priority transactions.
 * @returns Sorted and sliced array.
 */
function sortHighPriorityTransactions(
  highPriority: Transaction[]
): Transaction[] {
  return highPriority
    .sort((a, b) => {
      if (b.feePerVbyte !== a.feePerVbyte) {
        return b.feePerVbyte - a.feePerVbyte; // Sort by feePerVbyte descending
      }
      return b.time - a.time; // Within same fee, sort by time descending
    })
    .slice(0, AppConstants.MAX_VIZ_TX);
}

/**
 * Summarizes a category of transactions.
 * @param txs - Array of transactions in the category.
 * @returns A LowPriorityCategory summary.
 */
function summarizeCategory(txs: Transaction[]): LowPriorityCategory {
  return {
    count: txs.length,
    totalVsize: txs.reduce((sum, tx) => sum + tx.vsize, 0),
    avgFeePerVbyte:
      txs.length > 0
        ? txs.reduce((sum, tx) => sum + tx.feePerVbyte, 0) / txs.length
        : 0,
    exampleTxid: txs[0]?.txid,
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
      let categories: { [key in TransactionCategory]: Transaction[] };
      const removedSet = new Set(removedTxids);
      if (categoriesCache.has(cacheKey)) {
        categories = categoriesCache.get(cacheKey)!;
        // Filter out removed txs from all categories
        for (const catKey in categories) {
          const cat = catKey as TransactionCategory;
          categories[cat] = categories[cat].filter(
            (tx) => !removedSet.has(tx.txid)
          );
        }
      } else {
        categories = {
          highPriority: [],
          lowFee: [],
          ordinals: [],
          anomalous: [],
        };
      }

      // Process new transactions and update categories
      await processNewTransactions(newTxids, cachedMempool!, categories);

      // Cache the updated categories
      categoriesCache.set(cacheKey, { ...categories });

      // Sort high-priority txs
      const sortedHighPriority = sortHighPriorityTransactions(
        categories.highPriority
      );

      // Summarize low-priority categories
      const lowPriorityCategories = {
        lowFee: summarizeCategory(categories.lowFee),
        ordinals: summarizeCategory(categories.ordinals),
        anomalous: summarizeCategory(categories.anomalous),
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
