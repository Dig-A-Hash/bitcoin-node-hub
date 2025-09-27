export default defineEventHandler(
  async (event): Promise<ApiResponse<Transaction>> => {
    try {
      const { nodeIndex, txid } = AppConstants.BASE_VALIDATION_SCHEMA.extend({
        txid: z.string().length(64, 'Transaction ID must be 64 characters'),
      }).parse(getQuery(event));

      const rpcClient = new BitcoinRpcClient(nodeIndex);

      // Query bitcoin-cli for the transaction with verbose output
      const response = await rpcClient.blockchain.getRawTransaction(txid, true);

      if (!response) {
        throw new Error('Transaction not found');
      }

      return {
        success: true,
        data: response as Transaction,
      } as ApiResponse<Transaction>;
    } catch (error: any) {
      return sendErrorResponse(event, error);
    }
  }
);
