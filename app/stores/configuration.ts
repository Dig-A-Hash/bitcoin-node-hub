import { defineStore } from 'pinia';

export interface AppConfiguration {
  mempoolVisualizer: {
    POLL_INTERVAL: number;
  };
}

export const useConfiguration = defineStore('config', () => {
  const appConfiguration = ref<AppConfiguration>({
    mempoolVisualizer: {
      POLL_INTERVAL: 30000,
    },
  });

  return {
    appConfiguration,
  };
});
