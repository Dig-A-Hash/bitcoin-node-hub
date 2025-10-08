export default defineEventHandler(
  async (event): Promise<ApiResponse<(NodeName | {})[]>> => {
    try {
      const bitcoinNodeCredentials = getBitcoinNodeCredentials();
      const data = await Promise.all(
        bitcoinNodeCredentials.map(async (item, index) => {
          try {
            return {
              host: item.host,
              name: item.name || item.host,
              isError: false,
            } as NodeName;
          } catch (error) {
            return {
              host: item.host,
              name: item.name || item.host,
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
