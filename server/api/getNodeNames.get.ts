export default defineEventHandler(
  async (event): Promise<ApiResponse<NodeName[]>> => {
    try {
      const bitcoinNodeCredentials = getBitcoinNodeCredentials();
      const data: NodeName[] = bitcoinNodeCredentials.map((item) => ({
        host: item.host,
        name: item.name || item.host,
        isError: false,
      }));

      return {
        data,
        success: true,
      } as ApiResponse<NodeName[]>;
    } catch (error) {
      return sendErrorResponse(event, error);
    }
  }
);
