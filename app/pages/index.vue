<script setup lang="ts">
const bitcoinStore = useBitcoin();
const appSettings = useAppSettings();

const apiResponse = ref<(DashboardNode | null)[]>([]);
const isLoading = ref(false);
const pendingFetches = ref(new Set<number>()); // Track ongoing fetches by node index

/**
 * Loads cached data for nodes in IBD status.
 * @returns {void}
 */
function loadCachedData() {
  if (
    !apiResponse.value ||
    apiResponse.value.length !== bitcoinStore.nodeCount
  ) {
    apiResponse.value = new Array(bitcoinStore.nodeCount).fill(null);
  }

  if (bitcoinStore.cachedNodes.length > 0) {
    bitcoinStore.cachedNodes.forEach((cachedNode) => {
      if (
        cachedNode.nodeIndex !== undefined &&
        cachedNode.nodeIndex < apiResponse.value.length &&
        bitcoinStore.nodeNames[cachedNode.nodeIndex]?.isIbd
      ) {
        apiResponse.value[cachedNode.nodeIndex] = cachedNode;
      }
    });
    apiResponse.value = [...apiResponse.value]; // Trigger reactivity
  }
}

/**
 * Fetches dashboard data for each node and updates the apiResponse array.
 * @async
 * @param nodeIndex - Optional specific node index to fetch
 * @param options - Options including skipLoading to bypass loading state
 * @returns {Promise<void>}
 */
async function fetchDashboard(
  nodeIndex?: number,
  options: { skipLoading?: boolean } = {}
) {
  const { skipLoading = false } = options;

  if (
    !apiResponse.value ||
    apiResponse.value.length !== bitcoinStore.nodeCount
  ) {
    apiResponse.value = new Array(bitcoinStore.nodeCount).fill(null);
  }

  const fetchNode = async (i: number) => {
    if (!skipLoading) {
      pendingFetches.value.add(i); // Track fetch start only if not skipping
    }
    try {
      const response = await fetch('/api/getDashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeIndex: i }),
      });
      const { data } = (await response.json()) as ApiResponse<DashboardNode>;

      apiResponse.value[i] = data || null; // Set data or null on failure
      apiResponse.value = [...apiResponse.value]; // Trigger reactivity

      // Update IDB Status and maintain cache without duplicates
      if (bitcoinStore.nodeNames[i]) {
        bitcoinStore.nodeNames[i].isIbd =
          apiResponse.value[i]?.blockchainInfo.initialblockdownload ?? false;

        if (bitcoinStore.nodeNames[i].isIbd && data) {
          // Update or add to cache by node index
          const existingIndex = bitcoinStore.cachedNodes.findIndex(
            (cachedNode) => cachedNode.nodeIndex === i
          );
          if (existingIndex !== -1) {
            bitcoinStore.cachedNodes[existingIndex] = { ...data, nodeIndex: i };
          } else {
            bitcoinStore.cachedNodes.push({ ...data, nodeIndex: i });
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching node ${i}:`, error);
      apiResponse.value[i] = null; // Explicitly set null on error
      apiResponse.value = [...apiResponse.value]; // Trigger reactivity
    } finally {
      if (!skipLoading) {
        pendingFetches.value.delete(i); // Remove from pending fetches only if not skipping
        // Update isLoading based on pending fetches
        isLoading.value = pendingFetches.value.size > 0;
      }
    }
  };

  if (nodeIndex !== undefined) {
    await fetchNode(nodeIndex);
  } else {
    // For fetching all: Await all promises for proper completion handling
    const promises = Array.from({ length: bitcoinStore.nodeCount }, (_, i) =>
      fetchNode(i)
    );
    await Promise.all(promises);
  }
}

/**
 * Watches the nodeCount property in the bitcoinStore and triggers data fetching when it changes.
 * @type {import('vue').WatchStopHandle}
 */
watch(
  () => bitcoinStore.nodeCount,
  async () => {
    apiResponse.value = new Array(bitcoinStore.nodeCount).fill(null); // Reinitialize array
    pendingFetches.value.clear(); // Clear pending fetches
    loadCachedData(); // Load cached data after node count change
    if (bitcoinStore.nodeCount > 0) {
      isLoading.value = true; // Set loading upfront for full reload
    }
    await fetchDashboard(); // Now properly awaits all
  },
  { immediate: false }
);

/**
 * Reactive reference to store the interval IDs for periodic data fetching.
 * @type {import('vue').Ref<NodeJS.Timeout | null>}
 */
const intervalRef = ref<NodeJS.Timeout | null>(null);
const intervalSlowRef = ref<NodeJS.Timeout | null>(null);

onMounted(async () => {
  // Ensure array is initialized
  if (
    !apiResponse.value ||
    apiResponse.value.length !== bitcoinStore.nodeCount
  ) {
    apiResponse.value = new Array(bitcoinStore.nodeCount).fill(null);
  }
  loadCachedData(); // Load cached data for IBD nodes

  // Immediately fetch data for non-IBD nodes (default: skipLoading=false)
  const nonIbdIndices = Array.from(
    { length: bitcoinStore.nodeCount },
    (_, i) => i
  ).filter((i) => !bitcoinStore.nodeNames[i]?.isIbd);
  nonIbdIndices.forEach((i) => {
    fetchDashboard(i);
  });

  // After starting initial fetches (all adds are sync), set isLoading based on pending
  isLoading.value = pendingFetches.value.size > 0;

  // Set up intervals with skipLoading=true to avoid spinners on updates
  intervalRef.value = setInterval(() => {
    Array.from({ length: bitcoinStore.nodeCount }, (_, i) => {
      if (bitcoinStore.nodeNames[i]?.isIbd) return; // Skip IBD nodes
      fetchDashboard(i, { skipLoading: true });
    });
  }, appSettings.dashboard.POLL_INTERVAL);

  intervalSlowRef.value = setInterval(() => {
    Array.from({ length: bitcoinStore.nodeCount }, (_, i) => {
      if (!bitcoinStore.nodeNames[i]?.isIbd) return; // Skip non-IBD nodes
      fetchDashboard(i, { skipLoading: true });
    });
  }, appSettings.dashboard.POLL_INTERVAL_IBD);
});

onUnmounted(() => {
  if (intervalRef.value) clearInterval(intervalRef.value);
  if (intervalSlowRef.value) clearInterval(intervalSlowRef.value);
  pendingFetches.value.clear(); // Clear pending fetches on unmount
});
</script>

<template>
  <!-- Template renders a container with a loading state or a grid of dashboard cards -->
  <UContainer class="mt-4">
    <div
      v-if="
        isLoading &&
        !apiResponse.some((node) => node !== null && node !== undefined)
      "
      class="text-center"
    >
      Loading...
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <template v-for="(node, index) in apiResponse" :key="index">
        <!-- Render a card only if node is not undefined -->
        <card-dash
          :is-loading="isLoading"
          :dashboard-node="node"
          :node-index="index"
        ></card-dash>
      </template>
    </div>
  </UContainer>
</template>
