// Define type for cached mempool structure
interface CachedMempool {
  height: number;
  txs: Map<string, MempoolTransactionInfo>;
}

// Define caches outside the handler (global to the server process)
const mempoolCache = new Map<number, CachedMempool>();
const dustMinOutCache = new Map<string, number>(); // txid -> min output in satoshis (for dust checks)
const blocksCache = new Map<number, Block[]>(); // height -> recent blocks (stable per height)

// Define low-priority transaction categories
interface LowPriorityCategory {
  count: number;
  totalVsize: number;
  avgFeePerVbyte: number;
  exampleTxid?: string;
}

// Define the category keys as a type
type TransactionCategory =
  | 'highPriority'
  | 'lowFee'
  | 'dust'
  | 'ordinals'
  | 'anomalous';

interface BitcoinRpcError {
  code: number;
  message: string;
}

interface BitcoinRpcResponse<T> {
  id: string;
  result: T | null;
  error?: BitcoinRpcError | null;
}

interface VOut {
  value: number;
  scriptPubKey: {
    type: string;
  };
}

interface GetRawTransactionResult {
  vout: VOut[];
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
 * Fetches the latest mempool if cache is invalid.
 * @param nodeIndex - The Bitcoin node index.
 * @param blockCount - The current block count.
 * @param rpcClient - The Bitcoin RPC client.
 * @returns An object with the cached mempool, current mempool, and new txids.
 */
async function getAndUpdateMempoolCache(
  nodeIndex: number,
  blockCount: number,
  rpcClient: BitcoinRpcClient
) {
  let cachedMempool = mempoolCache.get(nodeIndex);
  if (!cachedMempool || cachedMempool.height !== blockCount) {
    // New block or no cache: reset
    cachedMempool = {
      height: blockCount,
      txs: new Map<string, MempoolTransactionInfo>(),
    };
    mempoolCache.set(nodeIndex, cachedMempool);
  }

  // Fetch current mempool (lightweight, gets us fresh txs)
  const mempool: RawMempoolVerbose = await rpcClient.mempool.getRawMempool(
    true
  );

  // Identify new txids (not in cache)
  const currentTxids = new Set(Object.keys(mempool));
  const cachedTxids = new Set(cachedMempool.txs.keys());
  const newTxids = [...currentTxids].filter((txid) => !cachedTxids.has(txid));

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

  return { cachedMempool, mempool, newTxids };
}

/**
 * Processes and categorizes transactions, separating cached and new ones.
 * @param cachedMempool - The cached mempool data.
 * @param newTxids - Array of new transaction IDs.
 * @returns An object with categorized transactions.
 */
function processCachedTransactions(
  cachedMempool: CachedMempool,
  newTxids: string[]
) {
  const categories: { [key in TransactionCategory]: Transaction[] } = {
    highPriority: [],
    lowFee: [],
    dust: [],
    ordinals: [],
    anomalous: [],
  };

  // Process cached transactions
  for (const [txid, details] of cachedMempool.txs) {
    if (newTxids.includes(txid)) continue; // Skip new txs for now
    const tx = buildTransaction(txid, details);
    const category = categorizeTransaction(tx, details);
    categories[category].push(tx);
  }

  return categories;
}

/**
 * Fetches and processes new transactions in batch, updating categories and dust cache.
 * @param newTxids - Array of new transaction IDs.
 * @param mempool - The current mempool data.
 * @param rpcClient - The Bitcoin RPC client.
 * @param categories - The current categories object to update.
 * @returns The number of failed transactions during processing.
 */
async function processNewTransactions(
  newTxids: string[],
  mempool: RawMempoolVerbose,
  rpcClient: BitcoinRpcClient,
  categories: { [key in TransactionCategory]: Transaction[] }
): Promise<number> {
  let failedTxCount = 0;
  if (newTxids.length === 0) return failedTxCount;

  // Batch fetch getrawtransaction for new txids (dust checks)
  const batchRequests = newTxids.map((txid, index) => ({
    jsonrpc: '1.0',
    id: `nuxt-rpc-tx-${index}`,
    method: 'getrawtransaction',
    params: [txid, true],
  }));
  const responseArray: BitcoinRpcResponse<GetRawTransactionResult>[] =
    await rpcClient.batchRpc(batchRequests);

  // Process batched responses
  for (const [index, response] of responseArray.entries()) {
    const txid = newTxids[index];
    const details = mempool[txid];
    const tx = buildTransaction(txid, details);
    const category = categorizeTransaction(tx, details);
    categories[category].push(tx);

    // Dust check caching
    try {
      if (response?.error) {
        console.warn(
          `Failed to fetch tx ${txid}: RPC error ${response.error.code}: ${response.error.message}`
        );
        failedTxCount++;
        continue;
      }
      if (!response?.result?.vout) {
        console.warn(`Invalid response for tx ${txid}: No result or vout data`);
        failedTxCount++;
        continue;
      }
      const outputs = response.result.vout;
      const minOutSat = Math.min(...outputs.map((out: any) => out.value * 1e8));
      dustMinOutCache.set(txid, minOutSat);
    } catch (e: any) {
      console.warn(`Unexpected error processing tx ${txid}: ${e.message}`);
      failedTxCount++;
    }
  }

  if (failedTxCount > 0) {
    console.info(
      `Dust fetching completed: ${failedTxCount}/${newTxids.length} new transactions failed`
    );
  }

  return failedTxCount;
}

/**
 * Performs dust checks for all transactions and updates the dust category.
 * @param mempool - The current mempool data.
 * @param dustThreshold - The calculated dust threshold.
 * @param dustCategory - The dust category array to update.
 */
function performDustChecks(
  mempool: RawMempoolVerbose,
  dustThreshold: number,
  dustCategory: Transaction[]
) {
  for (const [txid, details] of Object.entries(mempool)) {
    const minOutSat = dustMinOutCache.get(txid);
    if (minOutSat !== undefined && minOutSat < dustThreshold) {
      const tx = buildTransaction(txid, details);
      dustCategory.push(tx);
    }
  }
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
      const rpcClient = new BitcoinRpcClient(nodeIndex);

      // Always fetch block count first (lightweight) to check/invalidate cache
      const blockCount = await rpcClient.blockchain.getBlockCount();

      // Get or update mempool cache
      const { cachedMempool, mempool, newTxids } =
        await getAndUpdateMempoolCache(nodeIndex, blockCount, rpcClient);
      const totalTxCount = Object.keys(mempool).length;

      // Initialize categories from cached transactions
      let categories = processCachedTransactions(cachedMempool, newTxids);

      // Fetch network info for dust threshold
      const networkInfo = await rpcClient.network.getNetworkInfo();
      const minRelayFee = networkInfo.relayfee * 1e8;
      const dustThreshold = 0.5 * minRelayFee;

      // Process new transactions and update categories
      await processNewTransactions(newTxids, mempool, rpcClient, categories);

      // Perform dust checks for all transactions
      performDustChecks(mempool, dustThreshold, categories.dust);

      // Sort high-priority txs
      const sortedHighPriority = sortHighPriorityTransactions(
        categories.highPriority
      );

      // Summarize low-priority categories
      const lowPriorityCategories = {
        lowFee: summarizeCategory(categories.lowFee),
        dust: summarizeCategory(categories.dust),
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
