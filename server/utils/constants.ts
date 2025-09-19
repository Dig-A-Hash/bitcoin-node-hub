// constants.ts

export const AppConstants = {
  MAX_NODES: 32, // The max number of nodes allowed for monitoring.
  MAX_VIZ_TX: 3000, // The max number of txs to display to the browser.
} as const;

export type AppConstantsType = typeof AppConstants;
