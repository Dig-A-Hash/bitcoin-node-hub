export const AppConstants = {
  BASE_VALIDATION_SCHEMA: z.object({
    nodeIndex: z.coerce.number().min(0).max(32),
  }),
  MAX_NODES: 32, // The max number of nodes allowed for monitoring.
  MAX_VIZ_TX: 3000, // The max number of high-priority txs to display in the block visualizer.
} as const;

export type AppConstantsType = typeof AppConstants;
