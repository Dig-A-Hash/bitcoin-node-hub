import { defineStore } from 'pinia';
import type { DashboardNode } from '~~/shared/types/dashboard';
import type { NodeName } from '~~/shared/types/nodeName';

export const useBitcoin = defineStore('bitcoin', () => {
  const nodeCount = ref(0);
  const nodeNames = ref<NodeName[]>([]);
  const cachedNodes = ref<DashboardNode[]>([]);

  async function fetchNodeNames() {
    const response = await $fetch<ApiResponse<NodeName[]>>(
      '/api/getNodeNames',
      {
        method: 'GET',
      }
    );

    if (response.success && response.data) {
      // Wrap each node in reactive to ensure properties like isIbd are reactive
      nodeNames.value = response.data.map((node) => reactive(node));
      nodeCount.value = nodeNames.value.length;
    }
  }

  function updateNodeIbd(index: number, isIbd: boolean) {
    if (nodeNames.value[index]) {
      nodeNames.value[index].isIbd = isIbd;
    }
  }

  return {
    nodeCount,
    nodeNames,
    fetchNodeNames,
    updateNodeIbd,
    cachedNodes,
  };
});
