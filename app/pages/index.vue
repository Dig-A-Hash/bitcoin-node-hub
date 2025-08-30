<script setup lang="ts">
import type { ApiResponse } from '~~/shared/types/apiResponse';
import { type DashboardNode } from '~~/shared/types/dashboard';

const toast = useToast();
const apiResponse = ref<ApiResponse<DashboardNode[]>>();
const bitcoinStore = useBitcoin();

// Fetch data
async function fetchDashboard() {
  try {
    const response = await $fetch<ApiResponse<DashboardNode[]>>(
      '/api/getDashboard'
    );
    if (response.success && response.data && response.data.length > 0) {
      apiResponse.value = response;
    }
  } catch (error) {
    console.error('Error fetching metrics:', error);
  }
}

// Copy address
const copyAddress = async (address: string) => {
  try {
    await navigator.clipboard.writeText(address);
    toast.add({
      title: 'Success',
      description: 'Address copied to clipboard!',
      color: 'primary',
    });
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to copy address',
      color: 'error',
    });
    console.error('Error copying to clipboard:', error);
  }
};

async function fetchAndCache() {
  await fetchDashboard();

  // Save dashboard data to the bitcoinStore.
  if (apiResponse.value) {
    bitcoinStore.dashboardNodes = apiResponse.value.data
      ? apiResponse.value.data
      : [];
  }
}
const intervalRef = ref<NodeJS.Timeout | number | null>(null);

onMounted(async () => {
  // Run immediately on mount
  await fetchAndCache();
  // Set up interval to run every 60 seconds
  intervalRef.value = setInterval(fetchAndCache, 60000);
});

onUnmounted(() => {
  if (intervalRef.value !== null) {
    clearInterval(intervalRef.value);
  }
});
</script>

<template>
  <UContainer class="mt-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <template v-for="(node, index) in apiResponse?.data" :key="index">
        <card-dash :dashboard-node="node"></card-dash>
      </template>
    </div>
  </UContainer>
</template>
