import { ApiResponse } from '~~/shared/types/apiResponse';
import { sendErrorResponse } from '../utils/errors';
import { NodeCount } from '~~/shared/types/nodeCount';

export default defineEventHandler(
  async (event): Promise<ApiResponse<NodeCount>> => {
    try {
      const bitcoinNodeCredentials = getBitcoinNodeCredentials();

      return {
        data: { nodeCount: bitcoinNodeCredentials.length },
        success: true,
      } as ApiResponse<NodeCount>;
    } catch (error) {
      return sendErrorResponse(event, error);
    }
  }
);
