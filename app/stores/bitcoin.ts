import { defineStore } from 'pinia';
import type { DashboardNode } from '~~/shared/types/dashboard';
import type { NodeName } from '~~/shared/types/nodeName';

export const useBitcoin = defineStore('bitcoin', () => {
  const nodeCount = ref(0);
  const nodeNames = ref<NodeName[]>([]);
  const cachedNodes = ref<DashboardNode[]>([]);

  function initializeNodeState(node: NodeName): NodeName {
    return reactive({
      ...node,
      isError: node.isError ?? false,
      isIbd: node.isIbd ?? false,
      isLoading: false,
      hasLoaded: false,
      lastError: null,
    });
  }

  async function fetchNodeNames() {
    const response = await $fetch<ApiResponse<NodeName[]>>('/api/getNodeNames', {
      method: 'GET',
    });

    if (response.success && response.data) {
      nodeNames.value = response.data
        .map((node) => initializeNodeState(node));
      nodeCount.value = nodeNames.value.length;
    }
  }

  function updateNodeIbd(index: number, isIbd: boolean) {
    if (nodeNames.value[index]) {
      nodeNames.value[index].isIbd = isIbd;
    }
  }

  function updateNodeLoading(index: number, isLoading: boolean) {
    if (nodeNames.value[index]) {
      nodeNames.value[index].isLoading = isLoading;
    }
  }

  function updateNodeError(index: number, isError: boolean, lastError?: string) {
    if (nodeNames.value[index]) {
      nodeNames.value[index].isError = isError;
      nodeNames.value[index].lastError = isError ? lastError ?? null : null;
    }
  }

  function updateNodeLoaded(index: number, hasLoaded: boolean) {
    if (nodeNames.value[index]) {
      nodeNames.value[index].hasLoaded = hasLoaded;
    }
  }

  return {
    nodeCount,
    nodeNames,
    fetchNodeNames,
    updateNodeIbd,
    updateNodeLoading,
    updateNodeError,
    updateNodeLoaded,
    cachedNodes,
  };
});
