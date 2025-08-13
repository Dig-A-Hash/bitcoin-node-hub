<!-- src/components/Dashboard.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue';
import { type DashboardResponse } from '../../server/utils/bitcoinCoreTypes';
import { truncateNodeString } from '~~/utils/truncateString';

const toast = useToast();
const dashboardResponse = ref<DashboardResponse | null>(null);

// Fetch data
async function fetchDashboard() {
  try {
    const response = await $fetch<DashboardResponse>('/api/getDashboard');
    if (response.success && response.data && response.data.length > 0) {
      dashboardResponse.value = response;
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

// Compute percentages for each node
const nodeProgress = computed(() => {
  return (
    dashboardResponse.value?.data?.map((node) => {
      const total =
        (node.networkInfo.connections_in || 0) +
        (node.networkInfo.connections_out || 0);
      return {
        inPercent:
          total > 0 ? (node.networkInfo.connections_in / total) * 100 : 0,
        outPercent:
          total > 0 ? (node.networkInfo.connections_out / total) * 100 : 0,
      };
    }) || []
  );
});

onMounted(() => {
  fetchDashboard();
});
</script>

<template>
  <UContainer class="mt-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <card-node
        v-for="(myNode, index) in dashboardResponse?.data"
        :key="index"
        header-class=""
      >
        <template #header>
          <div
            class="flex items-center"
            v-if="myNode.networkInfo && myNode.networkInfo.localaddresses[0]"
          >
            <div class="border-r dark:border-slate-800 light:border-gray-200">
              <div
                class="rounded-none rounded-tl-lg p-2 px-4 h-18 flex items-center"
              >
                <div class="text-center">
                  <div class="text-xs">Node</div>
                  <div class="font-bold text-lg">{{ index + 1 }}</div>
                </div>
              </div>
            </div>
            <div class="p-4 truncate">
              {{ myNode.networkInfo?.localaddresses[0].address }}
            </div>
            <div class="border-l dark:border-slate-800 light:border-gray-200">
              <UButton
                class="rounded-none rounded-tr-lg h-18"
                @click="
                  copyAddress(myNode.networkInfo.localaddresses[0].address)
                "
                color="secondary"
                variant="ghost"
              >
                <div class="m-1">
                  <UIcon
                    size="24"
                    class=""
                    name="solar:hamburger-menu-bold"
                  ></UIcon>
                  <div class="text-xs">Addr.</div>
                </div>
              </UButton>
            </div>
          </div>
        </template>
        <div class="p-4 pb-2 flex items-center">
          <UBadge
            color="neutral"
            variant="outline"
            size="xl"
            class="font-bold rounded-full mr-2 px-4 py-3"
          >
            {{ myNode.networkInfo.connections }}
          </UBadge>
          Connections
        </div>
        <div v-if="nodeProgress[index]" class="px-4">
          <UProgress
            v-model="nodeProgress[index].inPercent"
            color="secondary"
            class="border border-neutral-500 rounded-lg"
          />
          <div class="mt-2 flex justify-between">
            <div>
              <UBadge color="secondary" class="font-bold mr-2 px-4">
                {{ myNode.networkInfo.connections_in }}
              </UBadge>
              <span class="text-secondary">In</span>
            </div>
            <div>
              <span class="text-neutral-500">Out</span>
              <UBadge
                class="font-bold ml-2 px-4 dark:bg-neutral-700 light:bg-neutral-300"
              >
                <span class="dark:text-neutral-300 light:text-neutral-600">{{
                  myNode.networkInfo.connections_out
                }}</span>
              </UBadge>
            </div>
          </div>
        </div>
        <divider class="my-4"></divider>
        <div>test</div>
      </card-node>
    </div>
  </UContainer>
</template>
