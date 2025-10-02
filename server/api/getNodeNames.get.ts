export default defineEventHandler(
  async (event): Promise<ApiResponse<(NodeName | {})[]>> => {
    try {
      const bitcoinNodeCredentials = getBitcoinNodeCredentials();
      const TIMEOUT_MS = 2000; // Adjust timeout as needed; short since getIndexInfo is quick

      const timeoutPromise = <T>(promise: Promise<T>, ms: number): Promise<T> =>
        Promise.race([
          promise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), ms)
          ),
        ]);

      const data = await Promise.all(
        bitcoinNodeCredentials.map(async (item, index) => {
          try {
            const rpcClient = new BitcoinRpcClient(index);
            const indexResponse = await timeoutPromise(
              rpcClient.config.getIndexInfo(),
              TIMEOUT_MS
            );
            return {
              host: item.host,
              name: item.name || item.host,
              isTxIndex: indexResponse.txindex?.best_block_height !== undefined,
              isError: false,
            } as NodeName;
          } catch (error) {
            return {
              host: item.host,
              name: item.name || item.host,
              isTxIndex: false,
              isError: true,
            } as NodeName;
          }
        })
      );

      return {
        data,
        success: true,
      } as ApiResponse<(NodeName | {})[]>;
    } catch (error) {
      return sendErrorResponse(event, error);
    }
  }
);
