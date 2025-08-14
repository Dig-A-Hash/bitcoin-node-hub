<!-- src/components/Dashboard.vue -->
<script setup lang="ts">
import { type DashboardResponse } from '~~/server/utils/bitcoinCoreTypes';

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

onMounted(() => {
  fetchDashboard();
});
</script>

<template>
  <UContainer class="mt-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <template v-for="(node, index) in dashboardResponse?.data" :key="index">
        <card-dash :dashboard-node="node"></card-dash>
      </template>

      <!-- <card-node
        v-for="(myNode, index) in dashboardResponse?.data"
        :key="index"
        header-class=""
      >
        <template #header>
          <div
            class="flex items-center"
            v-if="myNode.networkInfo && myNode.networkInfo.localaddresses[0]"
          >
            <div
              class="border-r dark:border-slate-800 light:border-gray-200 bg-green-subtle"
            >
              <div
                class="rounded-none rounded-tl-lg px-4 h-12 flex items-center"
              >
                <div class="text-center">
                  <div class="flex items-center">
                    <UChip standalone inset class="mr-2" />
                    <div class="text-xs">Online</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="px-4 truncate w-full">
              {{ myNode.host }}
            </div>
            <div class="border-l dark:border-slate-800 light:border-gray-200">
              <UTooltip text="Edit this nodes name.">
                <UButton
                  class="rounded-none rounded-tr-lg h-12"
                  @click="
                    copyAddress(myNode.networkInfo.localaddresses[0].address)
                  "
                  color="secondary"
                  variant="ghost"
                >
                  <UIcon
                    size="24"
                    class=""
                    name="solar:clapperboard-edit-linear"
                  ></UIcon>
                </UButton>
              </UTooltip>
            </div>
          </div>
        </template>
        <div class="p-4 pb-2 flex items-center justify-between">
          <UTooltip
            :text="`There are ${myNode.networkInfo.connections} connections currently made to this node.`"
          >
            <div class="cursor-default">
              <UBadge
                color="neutral"
                variant="outline"
                size="xl"
                class="font-bold rounded-full mr-2 px-4 py-3"
              >
                {{ myNode.networkInfo.connections }}
              </UBadge>
              <span class="text-lg">Connections</span>
            </div>
          </UTooltip>
          <UTooltip text="More info about the connections">
            <UButton
              color="secondary"
              variant="outline"
              icon="solar:global-outline"
              >View</UButton
            >
          </UTooltip>
        </div>
        <div v-if="nodeProgress[index]" class="px-4">
          <UProgress
            status
            v-model="nodeProgress[index].inPercent"
            color="secondary"
            class=""
            size="lg"
            :ui="{
              indicator: 'rounded-none bg-blue-700',
              base: 'bg-emerald-700  dark:border border-neutral-800',
            }"
          />
          <div class="mt-2 flex justify-between">
            <div>
              <UTooltip
                :text="`${myNode.networkInfo.connections_in} nodes have initiated incoming connections to this node.`"
              >
                <div class="cursor-default">
                  <UBadge size="lg" class="font-bold mr-2 px-4 bg-blue-700">
                    <span class="text-neutral-100">
                      {{ myNode.networkInfo.connections_in }}
                    </span>
                  </UBadge>
                  <span class="">In</span>
                </div>
              </UTooltip>
            </div>
            <div>
              <UTooltip
                :text="`This node has initiated ${myNode.networkInfo.connections_out} connections to other nodes.`"
              >
                <div class="cursor-default">
                  <span class="">Out</span>
                  <UBadge size="lg" class="font-bold ml-2 px-4 bg-emerald-700">
                    <span class="text-neutral-100">{{
                      myNode.networkInfo.connections_out
                    }}</span>
                  </UBadge>
                </div>
              </UTooltip>
            </div>
          </div>
        </div>
        <divider class="my-4"></divider>
        <div>test</div>
      </card-node> -->
    </div>
  </UContainer>
</template>
