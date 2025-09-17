<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { DashboardNode } from '~~/shared/types/dashboard';

const router = useRouter();
const { dashboardNode, nodeIndex } = defineProps<{
  dashboardNode: DashboardNode | null;
  nodeIndex: number;
}>();
const bytesInGB: number = 1073741824; // 1 GB = 2^30 bytes

// Compute percentages for the single node, rounded to whole numbers
const nodeProgress = computed(() => {
  if (!dashboardNode) return { inPercent: 0, outPercent: 0 };
  const total =
    (dashboardNode.networkInfo?.connections_in || 0) +
    (dashboardNode.networkInfo?.connections_out || 0);
  return {
    inPercent:
      total > 0
        ? Math.round(
            ((dashboardNode.networkInfo?.connections_in || 0) / total) * 100
          )
        : 0,
    outPercent:
      total > 0
        ? Math.round(
            ((dashboardNode.networkInfo?.connections_out || 0) / total) * 100
          )
        : 0,
  };
});

function getSyncProgress(value: number) {
  return value * 100;
}

function navigateToPeers(index: number) {
  router.push(`/peers?i=${index}`);
}

function navigateToNodeInfo(index: number) {
  router.push(`/node-info?i=${index}`);
}
</script>

<template>
  <card-subtle header-class="">
    <template #header>
      <div class="flex items-center">
        <div
          class="border-r dark:border-slate-800 light:border-slate-500"
          :class="dashboardNode ? 'bg-green-subtle' : 'bg-yellow-subtle'"
        >
          <div class="rounded-none rounded-tl-lg px-4 h-12 flex items-center">
            <div class="text-center">
              <div class="flex items-center">
                <UChip
                  standalone
                  inset
                  class="mr-2"
                  :color="dashboardNode ? 'success' : 'warning'"
                />
                <div class="text-xs">
                  {{ dashboardNode ? 'Online' : 'Pending' }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="px-4 truncate w-full">
          {{ dashboardNode ? dashboardNode.name : `Node ${nodeIndex}` }}
        </div>
        <div class="border-l dark:border-slate-800 light:border-slate-500 flex">
          <UTooltip
            v-if="dashboardNode?.indexInfo.txindex"
            :text="dashboardNode ? 'Search Transactions' : 'Node pending'"
          >
            <UButton
              class="rounded-none h-12"
              variant="ghost"
              color="secondary"
              @click="navigateToNodeInfo(nodeIndex)"
            >
              <UIcon size="24" name="material-symbols:search"></UIcon>
            </UButton>
          </UTooltip>
          <UTooltip :text="dashboardNode ? 'All node details' : 'Node pending'">
            <UButton
              class="rounded-none rounded-tr-lg h-12"
              color="secondary"
              variant="ghost"
              :disabled="!dashboardNode"
              @click="navigateToNodeInfo(nodeIndex)"
            >
              <UIcon size="24" name="material-symbols:more-vert"></UIcon>
            </UButton>
          </UTooltip>
        </div>
      </div>
    </template>

    <!-- Node Loading -->
    <div class="p-4 pb-2" v-if="!dashboardNode">
      <div class="text-center text-slate-500 max-w-sm mx-auto my-24 px-4">
        <div class="mb-3">
          <UProgress color="warning"></UProgress>
        </div>
        <div>Fetching Node Info...</div>
      </div>
    </div>

    <template v-else>
      <!-- Blockchain Info -->
      <div class="p-4 pb-0">
        <div class="flex justify-between items-center">
          <h2 class="text-lg">Blockchain Info</h2>
          <UBadge color="neutral" variant="subtle">{{
            dashboardNode.blockchainInfo.chain === 'main'
              ? 'Mainnet'
              : 'Testnet'
          }}</UBadge>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
          <card-tile>
            <div class="p-2 px-4">
              <div class="text-2xl">
                {{
                  dashboardNode.blockchainInfo.blocks.toLocaleString('en-US', {
                    style: 'decimal',
                  })
                }}
              </div>
              <div class="text-gray-500">Blocks</div>
            </div>
          </card-tile>
          <card-tile v-if="dashboardNode.blockchainInfo.initialblockdownload">
            <div class="p-2 px-4">
              <div class="text-2xl">
                {{
                  dashboardNode.blockchainInfo.headers.toLocaleString('en-US', {
                    style: 'decimal',
                  })
                }}
              </div>
              <div class="text-gray-500">Headers</div>
            </div>
          </card-tile>
          <card-tile v-else>
            <!-- TODO: change this to Bytes Downloaded from nuxt-rpc-nettotals-->
            <div class="p-2 px-4">
              <div class="text-2xl">
                {{
                  dashboardNode.blockchainInfo.headers.toLocaleString('en-US', {
                    style: 'decimal',
                  })
                }}
              </div>
              <div class="text-gray-500">Headers</div>
            </div>
          </card-tile>
          <card-tile>
            <div class="p-2 px-4">
              <div class="text-2xl">
                {{
                  (
                    dashboardNode.blockchainInfo.size_on_disk / bytesInGB
                  ).toLocaleString('en-US', {
                    style: 'decimal',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                }}
                GB
              </div>
              <div class="text-gray-500">Size on Disk</div>
            </div>
          </card-tile>
          <card-tile v-if="dashboardNode.blockchainInfo.initialblockdownload">
            <div class="p-2 px-4">
              <div class="flex justify-between">
                <div class="text-2xl capitalize">
                  {{
                    getSyncProgress(
                      parseFloat(
                        dashboardNode.blockchainInfo.verificationprogress.toFixed(
                          2
                        )
                      )
                    )
                  }}%
                </div>
                <UIcon
                  title="Initial Block Download (IBD) Mode"
                  name="material-symbols:refresh"
                  class="spinner ml-2"
                  size="32"
                />
              </div>
              <div class="text-gray-500">Sync Progress</div>
            </div>
          </card-tile>
          <card-tile v-else>
            <div class="p-2 px-4">
              <div class="text-2xl capitalize">
                {{
                  dashboardNode.networkInfo.localaddresses[0]?.score.toLocaleString(
                    'en-US',
                    {
                      style: 'decimal',
                    }
                  )
                }}
              </div>
              <div class="text-gray-500">Reliability Score</div>
            </div>
          </card-tile>
        </div>
      </div>

      <divider class="my-4"></divider>

      <!-- Peers -->
      <div class="p-4 pb-2 pt-0">
        <div class="text-lg mb-2">Peers</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
          <card-tile>
            <div class="p-2 px-4">
              <div class="text-2xl">
                {{ dashboardNode.networkInfo.connections }}
              </div>
              <div class="text-gray-500">Connections</div>
            </div>
          </card-tile>
          <card-tile-button @click="navigateToPeers(nodeIndex)">
            <div>
              <UIcon name="solar:global-outline" size="22"></UIcon>
            </div>
            <div>Connection Map</div>
          </card-tile-button>
        </div>
      </div>

      <!-- In/Out + Progress Bar -->
      <div class="px-4 pb-4">
        <div class="grid grid-cols-1 gap-2">
          <card-tile>
            <div class="p-2 px-4 flex justify-between">
              <div>
                <div class="text-2xl">
                  {{ dashboardNode.networkInfo.connections_in }}
                </div>
                <div class="text-gray-500">Incoming</div>
              </div>
              <div class="text-right">
                <div class="text-2xl">
                  {{ dashboardNode.networkInfo.connections_out }}
                </div>
                <div class="text-gray-500">Outgoing</div>
              </div>
            </div>
            <div class="p-4 pt-0">
              <UProgress
                status
                v-model="nodeProgress.inPercent"
                color="secondary"
                class=""
                size="lg"
                :ui="{
                  indicator: 'rounded-none',
                  status: 'light:text-slate-600 dark:text-slate-500',
                }"
              />
            </div>
          </card-tile>
        </div>
      </div>
    </template>
  </card-subtle>
</template>
