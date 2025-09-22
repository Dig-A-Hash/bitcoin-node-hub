import { ApiResponse } from '~~/shared/types/apiResponse';
import { sendErrorResponse } from '../utils/errors';
import { NodeName } from '~~/shared/types/nodeName';

export default defineEventHandler(
  async (event): Promise<ApiResponse<NodeName[]>> => {
    try {
      const bitcoinNodeCredentials = getBitcoinNodeCredentials();

      return {
        data: bitcoinNodeCredentials.map((item) => ({
          host: item.host,
          name: item.name || item.host,
        })),
        success: true,
      } as ApiResponse<NodeName[]>;
    } catch (error) {
      return sendErrorResponse(event, error);
    }
  }
);
