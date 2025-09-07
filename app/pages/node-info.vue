<script setup lang="ts">
import type { ApiResponse } from '~~/shared/types/apiResponse';

const apiResponse = ref<ApiResponse<NodeInfo>>();
const bitcoinStore = useBitcoin();
const router = useRouter();
const route = useRoute();
const nodeIndex = parseInt(route.query.i ? route.query.i.toString() : '0');
const dashboardNode = ref(bitcoinStore.dashboardNodes[nodeIndex]);

// Format bytes to human-readable units
const formatBytes = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

// Format timestamp to readable date
const formatTimestamp = (millis: number) => new Date(millis).toLocaleString();

// Fetch data
async function fetchNodeInfo(host: string) {
  try {
    const response = await $fetch<ApiResponse<NodeInfo>>('/api/getNodeInfo', {
      method: 'POST',
      body: { host },
    });
    if (response.success && response.data) {
      apiResponse.value = response;
    }
  } catch (error) {
    console.error('Error fetching metrics:', error);
  }
}

onMounted(async () => {
  if (bitcoinStore.dashboardNodes.length === 0) {
    router.push('/');
    return;
  }
  await fetchNodeInfo(dashboardNode.value?.host || '');
});
</script>

<template>
  <UContainer class="mt-4">
    <div v-if="apiResponse?.success && apiResponse.data" class="space-y-4 mb-4">
      <!-- Node Overview -->
      <card-subtle class=" ">
        <template #header>
          <div class="flex items-center justify-between p-4">
            <h2 class="text-xl font-semibold">
              {{ apiResponse.data.name || 'Node' }}
            </h2>
            <UBadge :color="apiResponse.data.error ? 'error' : 'success'">
              {{ apiResponse.data.error || 'Active' }}
            </UBadge>
          </div>
        </template>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
          <div>
            <p class="text-sm">Host</p>
            <p class="text-lg">{{ apiResponse.data.host }}</p>
          </div>
          <div>
            <p class="text-sm">Node Index</p>
            <p class="text-lg">{{ apiResponse.data.nodeIndex }}</p>
          </div>
          <div>
            <p class="text-sm">Chain</p>
            <p class="text-lg">
              {{ apiResponse.data.blockchainInfo.chain }}
            </p>
          </div>
        </div>
      </card-subtle>

      <!-- Blockchain and Mempool Info -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <card-subtle class="">
          <template #header>
            <div class="p-4">
              <h3 class="text-lg font-medium">Blockchain Info</h3>
            </div>
          </template>
          <div class="p-4 space-y-3">
            <div class="flex justify-between">
              <span class="">Blocks</span>
              <span class="">{{ apiResponse.data.blockchainInfo.blocks }}</span>
            </div>
            <div class="flex justify-between">
              <span class="">Difficulty</span>
              <span class="">{{ apiResponse.data.difficulty.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="">Size on Disk</span>
              <span class="">{{
                formatBytes(apiResponse.data.blockchainInfo.size_on_disk)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="">Sync Progress</span>
              <span class=""
                >{{
                  (
                    apiResponse.data.blockchainInfo.verificationprogress * 100
                  ).toFixed(2)
                }}%</span
              >
            </div>
            <div class="flex justify-between">
              <span class="">Pruned</span>
              <span class="">{{
                apiResponse.data.blockchainInfo.pruned ? 'Yes' : 'No'
              }}</span>
            </div>
          </div>
        </card-subtle>

        <card-subtle class="">
          <template #header>
            <div class="p-4">
              <h3 class="text-lg font-medium">Mempool Info</h3>
            </div>
          </template>
          <div class="p-4 space-y-3">
            <div class="flex justify-between">
              <span class="">Transactions</span>
              <span class="">{{ apiResponse.data.mempoolInfo.size }}</span>
            </div>
            <div class="flex justify-between">
              <span class="">Size</span>
              <span class="">{{
                formatBytes(apiResponse.data.mempoolInfo.bytes)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="">Total Fee</span>
              <span class=""
                >{{
                  apiResponse.data.mempoolInfo.total_fee.toFixed(8)
                }}
                BTC</span
              >
            </div>
            <div class="flex justify-between">
              <span class="">Min Fee Rate</span>
              <span class=""
                >{{
                  apiResponse.data.mempoolInfo.mempoolminfee.toFixed(8)
                }}
                BTC/kB</span
              >
            </div>
            <div class="flex justify-between">
              <span class="">RBF Policy</span>
              <span class="">{{
                apiResponse.data.mempoolInfo.rbf_policy
              }}</span>
            </div>
          </div>
        </card-subtle>
      </div>

      <!-- Network and Mining Info -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <card-subtle class="">
          <template #header>
            <div class="p-4">
              <h3 class="text-lg font-medium">Network Info</h3>
            </div>
          </template>
          <div class="p-4 space-y-3">
            <div class="flex justify-between">
              <span class="">Connections</span>
              <span class="">{{
                apiResponse.data.networkInfo.connections
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="">Version</span>
              <span class="">{{
                apiResponse.data.networkInfo.subversion
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="">Bytes Sent</span>
              <span class="">{{
                formatBytes(apiResponse.data.netTotals.totalbytessent)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="">Bytes Received</span>
              <span class="">{{
                formatBytes(apiResponse.data.netTotals.totalbytesrecv)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="">Last Updated</span>
              <span class="">{{
                formatTimestamp(apiResponse.data.netTotals.timemillis)
              }}</span>
            </div>
          </div>
        </card-subtle>

        <card-subtle class="">
          <template #header>
            <div class="p-4">
              <h3 class="text-lg font-medium">Mining Info</h3>
            </div>
          </template>
          <div class="p-4 space-y-3">
            <div class="flex justify-between">
              <span class="">Network Hash Rate</span>
              <span class=""
                >{{
                  formatBytes(apiResponse.data.miningInfo.networkhashps)
                }}
                H/s</span
              >
            </div>
            <div class="flex justify-between">
              <span class="">Difficulty</span>
              <span class="">{{
                apiResponse.data.miningInfo.difficulty.toFixed(2)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="">Pooled Transactions</span>
              <span class="">{{ apiResponse.data.miningInfo.pooledtx }}</span>
            </div>
            <div class="flex justify-between">
              <span class="">Warnings</span>
              <span class="">{{
                apiResponse.data.miningInfo.warnings || 'None'
              }}</span>
            </div>
          </div>
        </card-subtle>
      </div>

      <!-- Memory Info -->
      <card-subtle class="">
        <template #header>
          <div class="p-4">
            <h3 class="text-lg font-medium">Memory Info</h3>
          </div>
        </template>
        <div class="p-4 space-y-3">
          <div class="flex justify-between">
            <span class="">Used Memory</span>
            <span class="">{{
              formatBytes(apiResponse.data.memoryInfo.locked.used)
            }}</span>
          </div>
          <div class="flex justify-between">
            <span class="">Free Memory</span>
            <span class="">{{
              formatBytes(apiResponse.data.memoryInfo.locked.free)
            }}</span>
          </div>
          <div class="flex justify-between">
            <span class="">Total Memory</span>
            <span class="">{{
              formatBytes(apiResponse.data.memoryInfo.locked.total)
            }}</span>
          </div>
          <div class="flex justify-between">
            <span class="">Chunks Used/Free</span>
            <span class=""
              >{{ apiResponse.data.memoryInfo.locked.chunks_used }} /
              {{ apiResponse.data.memoryInfo.locked.chunks_free }}</span
            >
          </div>
        </div>
      </card-subtle>
    </div>
    <div v-else class="text-center">
      <p>Loading node information or no data available...</p>
    </div>
  </UContainer>
</template>
