import { z } from 'zod';
import { ApiResponse } from '~~/shared/types/apiResponse';
import { sendErrorResponse } from '~~/server/utils/errors';
import {
  Transaction,
  Block,
  VisualizerData,
} from '~~/shared/types/bitcoinCore';
import { AppConstants } from '~~/server/utils/constants';

// Define low-priority transaction categories
interface LowPriorityCategory {
  count: number;
  totalVsize: number;
  avgFeePerVbyte: number;
  exampleTxid?: string;
}

// Extend Block to include time
interface ExtendedBlock extends Block {
  time: number; // Block timestamp
}

// Extend VisualizerData to include categorized low-priority txs
interface ExtendedVisualizerData extends VisualizerData {
  transactions: Transaction[];
  blocks: ExtendedBlock[];
  totalTxCount: number;
  lowPriorityCategories: {
    lowFee: LowPriorityCategory;
    dust: LowPriorityCategory;
    ordinals: LowPriorityCategory;
    anomalous: LowPriorityCategory;
  };
}

// Define the POST endpoint
export default defineEventHandler(
  async (event): Promise<ApiResponse<ExtendedVisualizerData>> => {
    try {
      // Parse the request body for the node index
      const { nodeIndex } = z
        .object({
          nodeIndex: z.number().min(0).max(AppConstants.MAX_NODES).min(0),
        })
        .parse(await readBody(event));

      // Get Bitcoin node credentials
      const bitcoinNodeCredentials = getBitcoinNodeCredentials();
      const rpc = createBitcoinRpc(bitcoinNodeCredentials[nodeIndex]);

      // Fetch mempool and block count concurrently
      const [mempoolResponse, blockCountResponse] = await Promise.all([
        rpc.post('', {
          jsonrpc: '1.0',
          id: 'nuxt-rpc-mempool',
          method: 'getrawmempool',
          params: [true],
        }),
        rpc.post('', {
          jsonrpc: '1.0',
          id: 'nuxt-rpc-blockcount',
          method: 'getblockcount',
          params: [],
        }),
      ]);

      // Process mempool data
      const mempool: {
        [txid: string]: {
          fees: { base: number };
          vsize: number;
          time: number;
          bip125_replaceable: boolean;
          depends: string[];
        };
      } = mempoolResponse.data.result;
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
          ordinals.push(tx);
        } else if (details.depends.length > 3 || details.bip125_replaceable) {
          // Long dependency chains or RBF
          anomalous.push(tx);
        } else {
          highPriority.push(tx);
        }
      }

      // For dust, sample up to 100 txs to check outputs (to avoid excessive RPC calls)
      const dustThreshold = 3000; // ~3,000 satoshis
      const sampledTxs = [...lowFee, ...ordinals, ...anomalous].slice(0, 100);
      for (const tx of sampledTxs) {
        try {
          const txDetails = await rpc.post('', {
            jsonrpc: '1.0',
            id: `nuxt-rpc-tx-${tx.txid}`,
            method: 'getrawtransaction',
            params: [tx.txid, true],
          });
          const outputs = txDetails.data.result.vout;
          if (outputs.some((out: any) => out.value * 1e8 < dustThreshold)) {
            dust.push(tx);
            // Remove from other categories to avoid overlap
            lowFee.splice(
              lowFee.findIndex((t) => t.txid === tx.txid),
              1
            );
            ordinals.splice(
              ordinals.findIndex((t) => t.txid === tx.txid),
              1
            );
            anomalous.splice(
              anomalous.findIndex((t) => t.txid === tx.txid),
              1
            );
          }
        } catch (e) {
          // Skip if tx not found or other error
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

      // Fetch recent blocks (up to 5) with timestamps
      const blockCount: number = blockCountResponse.data.result;
      const blockPromises = [];
      for (let i = 0; i < 5 && blockCount - i > 0; i++) {
        blockPromises.push(
          rpc
            .post('', {
              jsonrpc: '1.0',
              id: `nuxt-rpc-blockhash-${i}`,
              method: 'getblockhash',
              params: [blockCount - i],
            })
            .then(async (hashResponse) => {
              const blockHash: string = hashResponse.data.result;
              const blockResponse = await rpc.post('', {
                jsonrpc: '1.0',
                id: `nuxt-rpc-block-${i}`,
                method: 'getblock',
                params: [blockHash],
              });
              const block: { hash: string; height: number; time: number } =
                blockResponse.data.result;
              return {
                hash: block.hash,
                height: block.height,
                time: block.time,
              } as ExtendedBlock;
            })
        );
      }
      const blocks: ExtendedBlock[] = await Promise.all(blockPromises);

      // Construct response
      const visualizerData: ExtendedVisualizerData = {
        transactions: sortedHighPriority,
        blocks,
        totalTxCount,
        lowPriorityCategories,
      };

      return {
        success: true,
        data: visualizerData,
      } as ApiResponse<ExtendedVisualizerData>;
    } catch (error: any) {
      return sendErrorResponse(event, error);
    }
  }
);
