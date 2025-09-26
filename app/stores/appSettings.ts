import { defineStore } from 'pinia';

export interface MempoolSettings {
  POLL_INTERVAL: number;
}

export interface DashboardSettings {
  POLL_INTERVAL: number;
  POLL_INTERVAL_IBD: number;
}

export const useAppSettings = defineStore(
  'config',
  () => {
    const mempool = ref<MempoolSettings>({
      POLL_INTERVAL: 30000,
    });

    const dashboard = ref<DashboardSettings>({
      POLL_INTERVAL: 30000,
      POLL_INTERVAL_IBD: 600000,
    });

    return {
      mempool,
      dashboard,
    };
  },
  {
    persist: {
      storage: piniaPluginPersistedstate.localStorage(),
    },
  }
);
