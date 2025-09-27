export default defineEventHandler(
  async (event): Promise<ApiResponse<NodeName[]>> => {
    try {
      const bitcoinNodeCredentials = getBitcoinNodeCredentials();

      const data = await Promise.all(
        bitcoinNodeCredentials.map(async (item, index) => {
          const rpcClient = new BitcoinRpcClient(index);
          const indexResponse = await rpcClient.config.getIndexInfo();
          return {
            host: item.host,
            name: item.name || item.host,
            isTxIndex: indexResponse.txindex?.best_block_height !== undefined,
          } as NodeName;
        })
      );

      return {
        data,
        success: true,
      } as ApiResponse<NodeName[]>;
    } catch (error) {
      return sendErrorResponse(event, error);
    }
  }
);
