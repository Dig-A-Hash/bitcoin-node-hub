<script setup lang="ts">
const nodeInfo = ref<NodeInfo>();
const bitcoinStore = useBitcoin();
const route = useRoute();
const nodeIndex = parseInt(route.params.i?.toString() || '');
const isLoading = ref(false);
const isError = ref(false);
const textDataSize = 'text-2xl';

// Fetch data
async function fetchNodeInfo() {
  try {
    isLoading.value = true;
    const response = await $fetch<ApiResponse<NodeInfo>>('/api/getNodeInfo', {
      method: 'POST',
      body: { nodeIndex },
    });
    if (response.success && response.data) {
      nodeInfo.value = response.data;
    }
  } catch (error) {
    console.error('Error fetching:', error);
    isError.value = true;
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  await fetchNodeInfo();
});
</script>

<template>
  <UContainer class="mt-4">
    <div v-if="nodeInfo && !isLoading">
      <h1 class="text-xl mb-4 text-white flex justify-between items-center">
        <span>Mempool </span>
        <UBadge
          size="xl"
          class="ml-4"
          color="primary"
          icon="material-symbols:network-node"
          variant="subtle"
        >
          {{ bitcoinStore.nodeNames[nodeIndex]?.name }}
        </UBadge>
      </h1>
      <div class="space-y-4 mb-4">
        <block-visualizer-html></block-visualizer-html>

        <!-- Mempool -->

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <card-subtle>
            <div class="p-4">
              <div :class="textDataSize">
                {{ nodeInfo.mempoolInfo.total_fee.toFixed(8) }} BTC
              </div>
              <div class="text-gray-500">Total Fee</div>
            </div>
          </card-subtle>
          <card-subtle>
            <div class="p-4">
              <div :class="textDataSize">
                {{ nodeInfo.mempoolInfo.mempoolminfee.toFixed(8) }}
              </div>
              <div class="text-gray-500">Min Fee Rate</div>
            </div>
          </card-subtle>
          <card-subtle>
            <div class="p-4">
              <div :class="textDataSize">
                {{ nodeInfo.mempoolInfo.rbf_policy }}
              </div>
              <div class="text-gray-500">RBF Policy</div>
            </div>
          </card-subtle>
        </div>
      </div>
    </div>
    <div v-else-if="isLoading" class="max-w-md p-8 mx-auto mt-12 text-center">
      <UProgress class="mb-2" color="warning"></UProgress>
      Loading Node Info...
    </div>
    <div v-else-if="isError" class="max-w-md p-8 mx-auto mt-12 text-center">
      <UAlert
        color="error"
        title="Error"
        description="There was an error fetching the data for this node."
      />
    </div>
  </UContainer>
</template>
