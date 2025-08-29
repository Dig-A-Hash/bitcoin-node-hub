import { defineStore } from 'pinia';

export const useBitcoin = defineStore('bitcoin', () => {
  const dashboardNodes = ref<DashboardNode[]>([]);

  return { dashboardNodes };
});
