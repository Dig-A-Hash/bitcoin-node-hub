<script setup lang="ts">
import type { ApiResponse } from '../../shared/types/apiResponse';
import type { DashboardNode } from '../../shared/types/dashboard';

/**
 * Reactive reference to an array of DashboardNode objects or null values,
 * representing the data fetched for each node in the dashboard.
 * @type {import('vue').Ref<(DashboardNode | null)[]>}
 */
const apiResponse = ref<(DashboardNode | null)[]>([]);

/**
 * Reference to the Bitcoin store, providing access to node count and dashboard nodes.
 * @type {ReturnType<typeof useBitcoin>}
 */
const bitcoinStore = useBitcoin();

/**
 * Reactive reference indicating whether data is currently being fetched.
 * @type {import('vue').Ref<boolean>}
 */
const isLoading = ref(false);

/**
 * Fetches dashboard data for each node and updates the apiResponse array.
 * @async
 * @returns {Promise<void>}
 */
async function fetchDashboard() {
  if (!apiResponse.value) {
    // Pre-allocate array with null values based on node count
    apiResponse.value = new Array(bitcoinStore.nodeCount).fill(null);
  }

  isLoading.value = true;

  // Fetch data for each node concurrently
  Array.from({ length: bitcoinStore.nodeCount }, (_, i) => {
    (async () => {
      try {
        const response = await fetch('/api/getDashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodeIndex: i }),
        });
        const { data } = (await response.json()) as ApiResponse<DashboardNode>;
        apiResponse.value[i] = data || null; // Set data or null on failure
        apiResponse.value = [...apiResponse.value]; // Trigger reactivity
      } catch (error) {
        console.error(`Error fetching node ${i}:`, error);
        apiResponse.value[i] = null; // Explicitly set null on error
        apiResponse.value = [...apiResponse.value]; // Trigger reactivity
      } finally {
        // Check if all requests are complete to update isLoading
        if (apiResponse.value.every((node) => node !== null)) {
          isLoading.value = false;
        }
      }
    })();
  });
}

/**
 * Watches the nodeCount property in the bitcoinStore and triggers data fetching when it changes.
 * @type {import('vue').WatchStopHandle}
 */
watch(
  () => bitcoinStore.nodeCount,
  async () => {
    await fetchDashboard();
  },
  { immediate: false }
);

/**
 * Reactive reference to store the interval ID for periodic data fetching.
 * @type {import('vue').Ref<NodeJS.Timeout | null>}
 */
const intervalRef = ref<NodeJS.Timeout | null>(null);

/**
 * Lifecycle hook to initiate data fetching and set up periodic updates on component mount.
 */
onMounted(async () => {
  await fetchDashboard();
  intervalRef.value = setInterval(fetchDashboard, 60000); // Fetch every 60 seconds
});

/**
 * Lifecycle hook to clean up the interval on component unmount.
 */
onUnmounted(() => {
  if (intervalRef.value) clearInterval(intervalRef.value);
});
</script>

<template>
  <!-- Template renders a container with a loading state or a grid of dashboard cards -->
  <UContainer class="mt-4">
    <div
      v-if="isLoading && !apiResponse.some((node) => node !== null)"
      class="text-center"
    >
      Loading...
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <template v-for="(node, index) in apiResponse" :key="index">
        <!-- Render a card for each node with its data and index -->
        <card-dash :dashboard-node="node" :node-index="index"></card-dash>
      </template>
    </div>
  </UContainer>
</template>
