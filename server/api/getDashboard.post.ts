import { AxiosError } from 'axios'; // Add this import if not already present

export default defineEventHandler(
  async (event): Promise<ApiResponse<DashboardNode>> => {
    try {
      const { nodeIndex } = AppConstants.BASE_VALIDATION_SCHEMA.parse(
        await readBody(event)
      );

      const rpcClient = new BitcoinRpcClient(nodeIndex);

      // Wrap each RPC call with .catch() to specifically handle Axios errors before re-throwing
      const blockchainInfoPromise = rpcClient.blockchain
        .getBlockchainInfo()
        .catch((error: unknown) => {
          if (error instanceof AxiosError) {
            // Handle Axios-specific logic here, e.g., logging or custom processing
            console.error('Axios error in blockchain.getBlockchainInfo:', {
              message: error.message,
              status: error.response?.status,
              url: error.config?.url,
            });
            throw new StatusError(
              error.response?.status || 500,
              `Node Error Response: ${error.message}`
            );
          } else {
            throw error;
          }
        });

      const networkInfoPromise = rpcClient.network
        .getNetworkInfo()
        .catch((error: unknown) => {
          if (error instanceof AxiosError) {
            console.error('Axios error in network.getNetworkInfo:', {
              message: error.message,
              status: error.response?.status,
              url: error.config?.url,
            });
            throw new StatusError(
              error.response?.status || 500,
              `Node Error Response: ${error.message}`
            );
          } else {
            throw error;
          }
        });

      const indexInfoPromise = rpcClient.config
        .getIndexInfo()
        .catch((error: unknown) => {
          if (error instanceof AxiosError) {
            console.error('Axios error in config.getIndexInfo:', {
              message: error.message,
              status: error.response?.status,
              url: error.config?.url,
            });
            throw new StatusError(
              error.response?.status || 500,
              `Node Error Response: ${error.message}`
            );
          } else {
            throw error;
          }
        });

      const upTimePromise = rpcClient.network
        .getUptime()
        .catch((error: unknown) => {
          if (error instanceof AxiosError) {
            console.error('Axios error in network.getUptime:', {
              message: error.message,
              status: error.response?.status,
              url: error.config?.url,
            });
            throw new StatusError(
              error.response?.status || 500,
              `Node Error Response: ${error.message}`
            );
          } else {
            throw error;
          }
        });

      const netTotalsPromise = rpcClient.network
        .getNetTotals()
        .catch((error: unknown) => {
          if (error instanceof AxiosError) {
            console.error('Axios error in network.getNetTotals:', {
              message: error.message,
              status: error.response?.status,
              url: error.config?.url,
            });

            throw new StatusError(error.response?.status || 500, error.message);
          } else {
            throw error;
          }
        });

      const [blockchainInfo, networkInfo, indexInfo, upTime, netTotals] =
        await Promise.all([
          blockchainInfoPromise,
          networkInfoPromise,
          indexInfoPromise,
          upTimePromise,
          netTotalsPromise,
        ]);

      const data: DashboardNode = {
        nodeIndex,
        name: rpcClient.name || rpcClient.host,
        host: rpcClient.host,
        blockchainInfo,
        networkInfo,
        indexInfo,
        upTime,
        netTotals,
      };

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return sendErrorResponse(event, error);
    }
  }
);
