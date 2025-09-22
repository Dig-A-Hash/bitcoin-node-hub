import { defineStore } from 'pinia';
import type { NodeName } from '~~/shared/types/nodeName';

export const useBitcoin = defineStore('bitcoin', () => {
  const dashboardNodes = ref<(DashboardNode | null)[]>([]);
  const nodeCount = ref(0);
  const nodeNames = ref<NodeName[]>();

  async function fetchNodeNames() {
    const response = await $fetch<ApiResponse<NodeName[]>>(
      '/api/getNodeNames',
      {
        method: 'GET',
      }
    );

    if (response.success && response.data) {
      nodeNames.value = response.data;
      nodeCount.value = nodeNames.value.length;
    }
  }

  return {
    dashboardNodes,
    nodeCount,
    nodeNames,
    fetchNodeNames,
  };
});
