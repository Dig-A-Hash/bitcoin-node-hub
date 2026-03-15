<script setup lang="ts">
const bitcoinStore = useBitcoin();
const appSettings = useAppSettings();
const { formatSecondsToDays } = useTextFormatting();

const apiResponse = ref<(DashboardNode | null)[]>([]);

const hasDashboardData = computed(() =>
  apiResponse.value.some((node) => node !== null && node !== undefined)
);

const isLoading = computed(
  () => bitcoinStore.nodeNames.some((node) => !!node.isLoading) && !hasDashboardData.value
);

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
      bitcoinStore.updateNodeLoading(i, true);
    }

    try {
      const response = await fetch('/api/getDashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeIndex: i }),
      });
      const payload = (await response.json()) as ApiResponse<DashboardNode>;

      if (!response.ok || !payload.success || !payload.data) {
        const errorMessage =
          typeof payload.error === 'string'
            ? payload.error
            : `Failed to load node ${i} (HTTP ${response.status})`;

        throw new Error(
          errorMessage
        );
      }

      const data = payload.data;

      apiResponse.value[i] = data;
      apiResponse.value = [...apiResponse.value]; // Trigger reactivity

      bitcoinStore.updateNodeIbd(i, data.blockchainInfo.initialblockdownload);
      bitcoinStore.updateNodeError(i, false);
      bitcoinStore.updateNodeLoaded(i, true);

      // Update IBD cache without duplicates
      if (bitcoinStore.nodeNames[i]) {
        if (bitcoinStore.nodeNames[i].isIbd) {
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
      bitcoinStore.updateNodeIbd(i, false);
      bitcoinStore.updateNodeError(
        i,
        true,
        error instanceof Error ? error.message : 'Failed to load node data'
      );
      bitcoinStore.updateNodeLoaded(i, true);
    } finally {
      if (!skipLoading) {
        bitcoinStore.updateNodeLoading(i, false);
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
    loadCachedData(); // Load cached data after node count change

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
  await fetchDashboard();

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
});
</script>

<template>
  <div class="" :class="{
    'mx-4': apiResponse.length > 2,
  }">
    <div v-if="
      isLoading &&
      !apiResponse.some((node) => node !== null && node !== undefined)
    " class="text-center">
      Loading...
    </div>
    <template v-else>
      <div :class="{
        'w-full max-w-(--ui-container) mx-auto px-4 sm:px-6 lg:px-8':
          apiResponse.length === 2,
      }">
        <div class="text-xl my-2 mt-4">Combined Totals</div>
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4" v-if="apiResponse.length > 1">
          <card-subtle class="p-4">
            <div class="text-2xl">
              {{
                formatSecondsToDays(
                  apiResponse.reduce(
                    (acc, item) => acc + (item ? item?.upTime : 0),
                    0
                  )
                )
              }}
            </div>
            <div class="text-gray-500">Up-Time</div>
          </card-subtle>
          <card-subtle class="p-4">
            <div class="text-2xl">
              {{
                apiResponse.reduce(
                  (acc, item) =>
                    acc + (item ? item?.networkInfo.connections : 0),
                  0
                )
              }}
            </div>
            <div class="text-gray-500">Peer Connections</div>
          </card-subtle>
          <card-subtle class="p-4">
            <div class="text-2xl">
              {{
                apiResponse.reduce(
                  (acc, item) =>
                    acc + (item ? item?.networkInfo.connections_in : 0),
                  0
                )
              }}
            </div>
            <div class="text-gray-500">Incoming Peers</div>
          </card-subtle>
          <card-subtle class="p-4">
            <div class="text-2xl">
              {{
                apiResponse.reduce(
                  (acc, item) =>
                    acc + (item ? item?.networkInfo.connections_out : 0),
                  0
                )
              }}
            </div>
            <div class="text-gray-500">Outgoing Peers</div>
          </card-subtle>
        </div>
        <div class="text-xl my-2 mt-8">Nodes</div>
        <div class="grid grid-cols-1 gap-4" :class="{
          'sm:grid-cols-2': apiResponse.length > 1,
          'xl:grid-cols-3': apiResponse.length > 2,
        }">
          <template v-for="(node, index) in apiResponse" :key="index">
            <card-dash :is-loading="bitcoinStore.nodeNames[index]?.isLoading ?? false" :dashboard-node="node"
              :node-index="index" :class="{
                'w-md mx-auto': apiResponse.length === 1,
              }"></card-dash>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>
