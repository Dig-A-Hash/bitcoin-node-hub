<!-- src/components/Dashboard.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import {
  type BlockchainInfo,
  type DashboardResponse,
  type NetworkInfo,
  type MemoryInfo,
  type ChainTxStats,
} from '../../server/utils/bitcoinCoreTypes';

// Define reactive state with types
const blockchainInfo = ref<BlockchainInfo | null>(null);
const networkInfo = ref<NetworkInfo | null>(null);

// Fetch data (example)
async function fetchDashboard() {
  try {
    const response = await $fetch<DashboardResponse>('/api/getDashboard');
    if (response.success && response.data && response.data.length > 0) {
      const firstNode = response.data[0]; // Use first node's metrics
      if (firstNode) {
        blockchainInfo.value = firstNode.blockchainInfo;
        networkInfo.value = firstNode.networkInfo;
      }
    }
  } catch (error) {
    console.error('Error fetching metrics:', error);
  }
}

onMounted(() => {
  fetchDashboard();
});
</script>

<template>
  <UContainer class="">
    <div class="grid grid-cols-1 my-4">
      <UCard>
        <div>{{ networkInfo?.localaddresses[0]?.address }}</div>
        <div>{{ networkInfo?.subversion }}</div>
      </UCard>
    </div>
    <div class="grid grid-cols-3 gap-4">
      <UCard> {{}} </UCard>
      <UCard>
        <h1>blockchainInfo</h1>
        <p v-if="blockchainInfo">{{ blockchainInfo }}</p>
      </UCard>
      <UCard>
        <h1>networkInfo</h1>
        <p v-if="networkInfo">{{ networkInfo }}</p>
      </UCard>
    </div>
  </UContainer>
</template>
