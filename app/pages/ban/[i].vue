<script setup lang="ts">
const banEntries = ref<BanEntry[]>();
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
    const response = await $fetch<ApiResponse<BanEntry[]>>(
      `/api/ban/listBanned?nodeIndex=${nodeIndex}`,
      {
        method: 'GET',
      }
    );
    if (response.success && response.data) {
      banEntries.value = response.data;
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
    <h1 class="text-xl mb-4 text-white flex justify-between items-center">
      <span> Bans </span>
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
    <div v-if="banEntries && !isLoading" class="space-y-4 mb-4">
      <card-subtle class=" ">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2">
          <card-tile>
            <div class="p-4">
              <p :class="textDataSize">Test</p>
              <p class="text-gray-500">Test</p>
            </div>
          </card-tile>
        </div>
      </card-subtle>
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
