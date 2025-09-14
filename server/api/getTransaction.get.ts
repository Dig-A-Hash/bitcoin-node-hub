import { Transaction } from '~~/shared/types/bitcoinCore';
import { z } from 'zod';

export default defineEventHandler(
  async (event): Promise<ApiResponse<Transaction>> => {
    try {
      const { nodeIndex, txid } = z
        .object({
          nodeIndex: z.string(),
          txid: z.string().length(64, 'Transaction ID must be 64 characters'),
        })
        .parse(getQuery(event));

      const bitcoinNodeCredentials = getBitcoinNodeCredentials();
      const rpc = createBitcoinRpc(bitcoinNodeCredentials[parseInt(nodeIndex)]);

      // Query bitcoin-cli for the transaction with verbose output
      const response = await rpc.post('', {
        jsonrpc: '1.0',
        id: 'nuxt-rpc',
        method: 'getrawtransaction',
        params: [txid, true], // Verbose mode to get detailed transaction info
      });

      if (!response.data.result) {
        throw new Error('Transaction not found');
      }

      return {
        success: true,
        data: response.data.result as Transaction,
      } as ApiResponse<Transaction>;
    } catch (error: any) {
      return sendErrorResponse(event, error);
    }
  }
);
