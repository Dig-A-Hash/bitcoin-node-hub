<script setup lang="ts">
import type { ApiResponse } from '~~/shared/types/apiResponse';
import type { NodeInfo } from '~~/shared/types/nodeInfo';

const apiResponse = ref<ApiResponse<NodeInfo>>();
const nodeInfo = ref<NodeInfo>();
const bitcoinStore = useBitcoin();
const router = useRouter();
const route = useRoute();
const nodeIndex = parseInt(route.query.i ? route.query.i.toString() : '0');
const dashboardNode = ref(bitcoinStore.dashboardNodes[nodeIndex]);
const isLocalAddressesDrawerOpen = ref(false);
const isLocalServicesDrawerOpen = ref(false);

const textDataSize = 'text-2xl';

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

function navigateToPeers(index: number) {
  router.push(`/peers?i=${index}`);
}

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
    console.error('Error fetching:', error);
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
          <div class="flex items-center justify-between p-2 px-4">
            <h2 class="text-lg">
              {{ apiResponse.data.name || 'Unnamed Node' }}
            </h2>
            <UBadge :color="apiResponse.data.error ? 'error' : 'success'">
              {{ apiResponse.data.error || 'Active' }}
            </UBadge>
          </div>
        </template>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2">
          <card-tile>
            <div class="p-4">
              <p :class="textDataSize">{{ apiResponse.data.host }}</p>
              <p class="text-gray-500">Host</p>
            </div>
          </card-tile>
          <card-tile>
            <div class="p-4">
              <p class="text-gray-500">Node Index</p>
              <p :class="textDataSize">{{ apiResponse.data.nodeIndex }}</p>
            </div>
          </card-tile>
          <card-tile>
            <div class="p-4">
              <p :class="textDataSize">
                {{ apiResponse.data.blockchainInfo.chain }}
              </p>
              <p class="text-gray-500">Chain</p>
            </div>
          </card-tile>
          <card-tile class="col-span-2">
            <div class="p-4">
              <div class="text-xl">
                {{ apiResponse.data.networkInfo.subversion }}
                <UBadge color="neutral" variant="subtle">{{
                  apiResponse.data.networkInfo.version
                }}</UBadge>
              </div>
              <div class="text-sm"></div>
              <div class="text-gray-500 mb-1">Version</div>
            </div>
          </card-tile>
        </div>
      </card-subtle>

      <div class="grid grid-cols-1 gap-4">
        <card-subtle class="">
          <template #header>
            <div class="p-2 px-4">
              <h3 class="text-lg font-medium">Network Info</h3>
            </div>
          </template>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2">
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ formatTimestamp(apiResponse.data.netTotals.timemillis) }}
                </div>
                <div class="text-gray-500">Last Updated</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ formatBytes(apiResponse.data.netTotals.totalbytessent) }}
                </div>
                <div class="text-gray-500">Bytes Sent</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ formatBytes(apiResponse.data.netTotals.totalbytesrecv) }}
                </div>
                <div class="text-gray-500">Bytes Received</div>
              </div>
            </card-tile>

            <card-tile-button @click="navigateToPeers(nodeIndex)">
              <div>
                <UIcon name="solar:global-outline" size="22"></UIcon>
              </div>
              <div>Connection Map</div>
            </card-tile-button>
            <card-tile-button @click="navigateToPeers(nodeIndex)">
              <div>
                <UIcon name="material-symbols:in-home-mode" size="22"></UIcon>
              </div>
              <div>Local Addresses</div>
            </card-tile-button>
            <card-tile-button @click="navigateToPeers(nodeIndex)">
              <div>
                <UIcon name="material-symbols:bolt" size="22"></UIcon>
              </div>
              <div>Local Services</div>
            </card-tile-button>
          </div>
        </card-subtle>

        <!-- Blockchain Info -->
        <card-subtle class="">
          <template #header>
            <div class="p-4">
              <h3 class="text-lg font-medium">Blockchain Info</h3>
            </div>
          </template>
          <div class="p-4 space-y-3">
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ apiResponse.data.blockchainInfo.blocks }}
                </div>
                <div class="">Blocks</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ apiResponse.data.difficulty }}
                </div>
                <div class="">Difficulty</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{
                    formatBytes(apiResponse.data.blockchainInfo.size_on_disk)
                  }}
                </div>
                <div class="">Size on Disk</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{
                    apiResponse.data.blockchainInfo.initialblockdownload
                      ? 'Yes'
                      : 'No'
                  }}
                </div>
                <div class="">Initial Block Download (IBD) Mode</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ apiResponse.data.blockchainInfo.verificationprogress }}%
                </div>
                <div class="">Sync Progress</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ apiResponse.data.blockchainInfo.pruned ? 'Yes' : 'No' }}
                </div>
                <div class="">Pruned</div>
              </div>
            </card-tile>
          </div>
        </card-subtle>

        <!-- Mempool -->
        <card-subtle class="">
          <template #header>
            <div class="p-4">
              <h3 class="text-lg font-medium">Mempool Info</h3>
            </div>
          </template>
          <div class="p-4 space-y-3">
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ apiResponse.data.mempoolInfo.size }}
                </div>
                <div class="">Transactions</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ formatBytes(apiResponse.data.mempoolInfo.bytes) }}
                </div>
                <div class="">Size</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ apiResponse.data.mempoolInfo.total_fee.toFixed(8) }} BTC
                </div>
                <div class="">Total Fee</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ apiResponse.data.mempoolInfo.mempoolminfee.toFixed(8) }}
                  BTC/kB
                </div>
                <div class="">Min Fee Rate</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ apiResponse.data.mempoolInfo.rbf_policy }}
                </div>
                <div class="">RBF Policy</div>
              </div>
            </card-tile>
          </div>
        </card-subtle>
      </div>

      <!-- Network Info -->
      <div class="grid grid-cols-1 gap-4">
        <!-- Mining Info -->
        <card-subtle class="">
          <template #header>
            <div class="p-4">
              <h3 class="text-lg font-medium">Mining Info</h3>
            </div>
          </template>
          <div class="p-4 space-y-3">
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ formatBytes(apiResponse.data.miningInfo.networkhashps) }}
                  H/s
                </div>
                <div class="">Network Hash Rate</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ apiResponse.data.miningInfo.difficulty.toFixed(2) }}
                </div>
                <div class="">Difficulty</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ apiResponse.data.miningInfo.pooledtx }}
                </div>
                <div class="">Pooled Transactions</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ apiResponse.data.miningInfo.warnings || 'None' }}
                </div>
                <div class="">Warnings</div>
              </div>
            </card-tile>
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
          <card-tile>
            <div class="p-4">
              <div :class="textDataSize">
                {{ formatBytes(apiResponse.data.memoryInfo.locked.used) }}
              </div>
              <div class="">Used Memory</div>
            </div>
          </card-tile>
          <card-tile>
            <div class="p-4">
              <div :class="textDataSize">
                {{ formatBytes(apiResponse.data.memoryInfo.locked.free) }}
              </div>
              <div class="">Free Memory</div>
            </div>
          </card-tile>
          <card-tile>
            <div class="p-4">
              <div :class="textDataSize">
                {{ formatBytes(apiResponse.data.memoryInfo.locked.total) }}
              </div>
              <div class="">Total Memory</div>
            </div>
          </card-tile>
          <card-tile>
            <div class="p-4">
              <div :class="textDataSize">
                {{ apiResponse.data.memoryInfo.locked.chunks_used }} /
                {{ apiResponse.data.memoryInfo.locked.chunks_free }}
              </div>
              <div class="">Chunks Used/Free</div>
            </div>
          </card-tile>
        </div>
      </card-subtle>
    </div>

    <div v-else class="text-center">
      <p>Loading node information or no data available...</p>
    </div>
  </UContainer>
  <USlideover
    v-model:open="isLocalAddressesDrawerOpen"
    aria-describedby="undefined"
    direction="right"
    :overlay="false"
    title="Peer Details"
    :modal="false"
    class="w-full max-w-md"
    close-icon="solar:close-square-bold"
  >
    <template #body> Local Addresses </template>
  </USlideover>
  <USlideover
    v-model:open="isLocalServicesDrawerOpen"
    aria-describedby="undefined"
    direction="right"
    :overlay="false"
    title="Peer Details"
    :modal="false"
    class="w-full max-w-md"
    close-icon="solar:close-square-bold"
  >
    <template #body> Local Addresses </template>
  </USlideover>
</template>
