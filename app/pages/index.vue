<!-- src/components/Dashboard.vue -->
<script setup lang="ts">
import type { ApiResponse } from '~~/server/types/apiResponse';
import { type DashboardNode } from '~~/server/types/dashboard';

const toast = useToast();
const apiResponse = ref<ApiResponse<DashboardNode[]>>();

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

onMounted(() => {
  fetchDashboard();
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
