<!-- src/components/Dashboard.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import {
  type BlockchainInfo,
  type ApiResponse,
  type NetworkInfo,
  type MemoryInfo,
  type ChainTxStats,
} from '../../server/utils/bitcoinCoreTypes';

// Define reactive state with types
const blockchainInfo = ref<BlockchainInfo | null>(null);
const networkInfo = ref<NetworkInfo | null>(null);
const memoryInfo = ref<MemoryInfo | null>(null);
const chainTxStats = ref<ChainTxStats | null>(null);

// Fetch data (example)
async function fetchMetrics() {
  try {
    const response = await $fetch<ApiResponse>('/api/getDashboard');
    if (response.success && response.data) {
      blockchainInfo.value = response.data.blockchainInfo;
      networkInfo.value = response.data.networkInfo;
      memoryInfo.value = response.data.memoryInfo;
      chainTxStats.value = response.data.chainTxStats;
    }
  } catch (error) {
    console.error('Error fetching metrics:', error);
  }
}
onMounted(() => {
  fetchMetrics();
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
      <UCard>
        {{}}
      </UCard>
      <UCard>
        <h1>getBlockchainInfo</h1>
        <p v-if="getBlockchainInfo">
          getBlockchainInfo: {{ getBlockchainInfo }}
        </p>
      </UCard>
      <UCard>
        <h1>getBlockchainInfo</h1>
        <p v-if="getBlockchainInfo">
          getBlockchainInfo: {{ getBlockchainInfo }}
        </p>
      </UCard>
    </div>
  </UContainer>
</template>
