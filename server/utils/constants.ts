import { z } from 'zod';

export const AppConstants = {
  BASE_VALIDATION_SCHEMA: z.object({
    nodeIndex: z.coerce.number().min(0).max(32),
  }),
  MAX_NODES: 32, // The max number of nodes allowed for monitoring.
  MAX_VIZ_TX: 3000, // The max number of high-priority txs to display in the block visualizer.
  BATCH_CHUNK_SIZE: 2000, // Max txids per batch RPC request (chunking for large mempools).
  HIGH_PRIORITY_BUFFER: 3500, // Internal buffer size for high-priority txs (above MAX_VIZ_TX display limit).
  RPC_TIMEOUT_MS: 30000, // Axios timeout for individual RPC calls to the Bitcoin node.
} as const;

export type AppConstantsType = typeof AppConstants;
