import { defineStore } from 'pinia';
import type { NodeCount } from '~~/shared/types/nodeCount';

export const useBitcoin = defineStore('bitcoin', () => {
  const dashboardNodes = ref<(DashboardNode | null)[]>([]);
  const nodeCount = ref(0);

  async function fetchNodeCount() {
    const response = await $fetch<ApiResponse<NodeCount>>('/api/getNodeCount', {
      method: 'GET',
    });

    if (response.success && response.data) {
      nodeCount.value = response.data.nodeCount;
    }
  }

  return { dashboardNodes, nodeCount, fetchNodeCount };
});
