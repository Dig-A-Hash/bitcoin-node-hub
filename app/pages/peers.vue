<script setup lang="ts">
import { type ApiResponse } from '~~/server/types/apiResponse';
import type { PeerInfo } from '~~/server/types/bitcoinCore';

const toast = useToast();
const apiResponse = ref<ApiResponse<PeerInfo>>();

// Fetch data
async function fetchPeers() {
  try {
    const response = await $fetch<ApiResponse<PeerInfo>>(
      '/api/getPeerInfo?host=192.168.7.253'
    );
    if (response.success && response.data) {
      apiResponse.value = response;
    }
  } catch (error) {
    console.error('Error fetching metrics:', error);
  }
}

onMounted(() => {
  fetchPeers();
});
</script>

<template>
  <UContainer class="mt-4">
    <div class="grid grid-cols-1 gap-4">
      <!-- Open Layers map here -->
    </div>
  </UContainer>
</template>
