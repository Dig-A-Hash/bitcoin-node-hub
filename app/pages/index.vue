<script setup lang="ts">
import type { ApiResponse } from '../../shared/types/apiResponse';
import type { DashboardNode } from '../../shared/types/dashboard';

const apiResponse = ref<(DashboardNode | null)[]>([]);
const bitcoinStore = useBitcoin();
const isLoading = ref(false);

// Fetch data
async function fetchDashboard() {
  if (!apiResponse.value) {
    apiResponse.value = new Array(bitcoinStore.nodeCount).fill(null); // Pre-allocate array
  }

  isLoading.value = true;

  Array.from({ length: bitcoinStore.nodeCount }, (_, i) => {
    (async () => {
      try {
        // console.log(`Starting fetch for node ${i}:`, Date.now()); // Debug concurrency
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
        apiResponse.value = [...apiResponse.value];
      } finally {
        // Check if all requests are done to update isLoading
        if (apiResponse.value.every((node) => node !== null)) {
          isLoading.value = false;
        }
      }
    })();
  });
}

// fetchAndCache without debounce (as requested)
async function fetchAndCache() {
  try {
    await fetchDashboard();
    if (apiResponse.value) {
      bitcoinStore.dashboardNodes = [...apiResponse.value];
    }
  } catch (error) {
    console.error('Error in fetchAndCache:', error);
    isLoading.value = false;
  }
}

// Watch nodeCount
watch(
  () => bitcoinStore.nodeCount,
  async () => {
    await fetchAndCache();
  },
  { immediate: false }
);

const intervalRef = ref<NodeJS.Timeout | null>(null);

onMounted(() => {
  fetchAndCache();
  intervalRef.value = setInterval(fetchAndCache, 60000);
});

onUnmounted(() => {
  if (intervalRef.value) clearInterval(intervalRef.value);
});
</script>

<template>
  <UContainer class="mt-4">
    <div
      v-if="isLoading && !apiResponse.some((node) => node !== null)"
      class="text-center"
    >
      Loading...
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <template v-for="(node, index) in apiResponse" :key="index">
        <card-dash :dashboard-node="node" :node-index="index"></card-dash>
      </template>
    </div>
  </UContainer>
</template>
