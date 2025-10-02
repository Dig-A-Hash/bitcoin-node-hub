<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';
import { computed } from 'vue';
import type { DashboardNode } from '~~/shared/types/dashboard';

const { formatSecondsToDays, formatBytes } = useTextFormatting();
const bitcoinStore = useBitcoin();

const { dashboardNode, nodeIndex, isLoading } = defineProps<{
  dashboardNode: DashboardNode | null;
  nodeIndex: number;
  isLoading: boolean;
}>();

const bytesInGB: number = 1073741824; // 1 GB = 2^30 bytes
const bitcoinNodes = computed(() => bitcoinStore.nodeNames); // Reactively sync with nodeNames

// Compute status reactively
const status = computed(() => {
  if (bitcoinNodes.value[nodeIndex]?.isError) {
    return 'Offline';
  } else if (bitcoinNodes.value[nodeIndex]?.isIbd) {
    return 'Syncing';
  } else if (!dashboardNode && isLoading) {
    return 'Loading';
  } else {
    return 'Online';
  }
});

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

// Navigation items
const navItems = ref<DropdownMenuItem[]>([] satisfies DropdownMenuItem[]);

watch(
  bitcoinNodes,
  (newNodes) => {
    // generate menu
    if (
      !navItems.value.find((item) => item.label === 'General Info') &&
      newNodes.length
    ) {
      navItems.value.push({
        label: 'General Info',
        to: `/node-info/${nodeIndex}`,
      });

      navItems.value.push({
        label: 'Mempool',
        to: `/mempool/${nodeIndex}`,
      });

      navItems.value.push({
        label: 'Peers',
        to: `/peers/${nodeIndex}`,
      });

      navItems.value.push({
        label: 'Bans',
        to: `/ban/${nodeIndex}`,
      });
    }
  },
  { immediate: true, deep: true }
);

function getStatusColor() {
  switch (status.value) {
    case 'Syncing':
    case 'Loading':
      return 'bg-yellow-500/15';
    case 'Offline':
      return 'bg-red-500/15';
    default:
      return 'bg-green-500/15';
  }
}

function getStatusLightColor() {
  switch (status.value) {
    case 'Syncing':
    case 'Loading':
      return 'warning';
    case 'Offline':
      return 'error';
    default:
      return 'success';
  }
}
</script>

<template>
  <card-subtle header-class="">
    <template #header>
      <div class="flex items-center">
        <div
          class="border-r dark:border-slate-800 light:border-slate-500"
          :class="getStatusColor()"
        >
          <div class="rounded-none rounded-tl-lg px-4 h-12 flex items-center">
            <div class="text-center">
              <div class="flex items-center">
                <UChip
                  standalone
                  :color="getStatusLightColor()"
                  inset
                  class="mr-2"
                />
                <div class="text-xs">
                  {{ status }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="px-4 truncate w-full">
          <!-- Get the node name from the dash query, but if that has not arrived or is null, then get the node name from the bitcoinStore. -->
          {{
            dashboardNode
              ? dashboardNode.name
              : bitcoinStore.nodeNames[nodeIndex]?.name
          }}
        </div>
        <div class="border-l dark:border-slate-800 light:border-slate-500 flex">
          <UDropdownMenu :items="navItems">
            <UTooltip
              :text="
                !dashboardNode ||
                dashboardNode.blockchainInfo.initialblockdownload
                  ? 'Actions are Disabled'
                  : 'Actions'
              "
            >
              <UButton
                class="rounded-none rounded-tr-lg h-12"
                color="secondary"
                variant="ghost"
                :disabled="
                  !dashboardNode ||
                  dashboardNode.blockchainInfo.initialblockdownload
                "
              >
                <UIcon size="24" name="material-symbols:more-vert"></UIcon>
              </UButton>
            </UTooltip>
          </UDropdownMenu>
        </div>
      </div>
    </template>

    <!-- Node Loading -->
    <div class="p-4 pb-2" v-if="isLoading && !dashboardNode">
      <div class="text-center text-slate-500 max-w-sm mx-auto my-24 px-4">
        <div class="mb-3">
          <UProgress color="warning"></UProgress>
        </div>
        <div>Fetching Node Info...</div>
      </div>
    </div>

    <template v-else-if="!isLoading && dashboardNode">
      <!-- Blockchain Info -->

      <div class="p-4 pb-0">
        <div class="flex justify-between items-center">
          <h2 class="text-lg">Status</h2>
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
            <div class="p-2 px-4">
              <div class="text-2xl">
                {{ formatSecondsToDays(dashboardNode.upTime) }}
              </div>
              <div class="text-gray-500">Up Time</div>
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
                    parseFloat(
                      dashboardNode.blockchainInfo.verificationprogress.toFixed(
                        2
                      )
                    ) * 100
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
          <card-tile>
            <div class="p-2 px-4">
              <div class="text-2xl">
                {{ formatBytes(dashboardNode.netTotals.totalbytessent) }}
              </div>
              <div class="text-gray-500">Bytes Sent</div>
            </div>
          </card-tile>
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
    <div v-else class="mt-16">
      <div class="flex justify-center">
        <UIcon
          size="64"
          name="material-symbols:network-node"
          class="dark:text-red-500/50 light:text-red-600/60"
        ></UIcon>
      </div>
      <div class="text-center text-sm dark:text-slate-500 mt-2">
        This node is offline or not responding.
      </div>
    </div>
  </card-subtle>
</template>
