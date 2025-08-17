<script setup lang="ts">
import {
  type DashboardNode,
  type DashboardResponse,
} from '~~/server/utils/bitcoinCoreTypes';

const { dashboardNode } = defineProps<{
  dashboardNode: DashboardNode;
}>();
const bytesInGB: number = 1073741824; // 1 GB = 2^30 bytes

// Compute percentages for the single node, rounded to whole numbers
const nodeProgress = computed(() => {
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
</script>
<template>
  <card-node v-if="!dashboardNode.error" header-class="">
    <template #header>
      <div
        class="flex items-center"
        v-if="
          dashboardNode.networkInfo &&
          dashboardNode.networkInfo.localaddresses[0]
        "
      >
        <div
          class="border-r dark:border-slate-800 light:border-gray-200 bg-green-subtle"
        >
          <div class="rounded-none rounded-tl-lg px-4 h-12 flex items-center">
            <div class="text-center">
              <div class="flex items-center">
                <UChip standalone inset class="mr-2" />
                <div class="text-xs">Online</div>
              </div>
            </div>
          </div>
        </div>
        <div class="px-4 truncate w-full">
          {{ dashboardNode.name }}
        </div>
        <div class="border-l dark:border-slate-800 light:border-gray-200">
          <UTooltip text="View node addresses.">
            <UButton
              class="rounded-none rounded-tr-lg h-12"
              color="secondary"
              variant="ghost"
            >
              <UIcon size="24" class="" name="solar:info-square-bold"></UIcon>
            </UButton>
          </UTooltip>
        </div>
      </div>
    </template>

    <!-- Blockchain Info -->

    <div class="p-4 pb-0">
      <div class="flex justify-between items-center">
        <h2 class="text-lg">Blockchain Info</h2>
        <div class="text-sm">
          ({{
            dashboardNode.blockchainInfo.chain === 'main'
              ? 'Mainnet'
              : 'Testnet'
          }})
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        <card-tile>
          <div class="p-2 px-4">
            <div class="text-3xl">
              {{
                dashboardNode.blockchainInfo.blocks.toLocaleString('en-US', {
                  style: 'decimal',
                })
              }}
            </div>
            <div>Blocks</div>
          </div>
        </card-tile>
        <card-tile>
          <div class="p-2 px-4">
            <div class="text-3xl">
              {{
                dashboardNode.blockchainInfo.headers.toLocaleString('en-US', {
                  style: 'decimal',
                })
              }}
            </div>
            <div>Headers</div>
          </div>
        </card-tile>
        <card-tile>
          <div class="p-2 px-4">
            <div class="text-3xl capitalize">
              {{ dashboardNode.blockchainInfo.pruned }}
            </div>
            <div>Pruned</div>
          </div>
        </card-tile>
        <card-tile>
          <div class="p-2 px-4">
            <div class="text-3xl">
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
            <div>Size on Disk</div>
          </div>
        </card-tile>
      </div>
      <div></div>
    </div>

    <divider class="my-4"></divider>

    <!-- Connections -->

    <div class="p-4 pb-2 pt-0 flex items-center justify-between">
      <div>
        <div class="text-lg mb-2">Connections</div>
        <UTooltip
          :text="`There are ${dashboardNode.networkInfo.connections} connections currently made to this node.`"
        >
          <div class="cursor-default">
            <UBadge
              color="neutral"
              variant="outline"
              size="xl"
              class="font-bold rounded-full mr-1 px-4 py-3"
            >
              {{ dashboardNode.networkInfo.connections }}
            </UBadge>
            Total
          </div>
        </UTooltip>
      </div>
      <UTooltip text="View details about the connections.">
        <UButton color="secondary" variant="subtle" icon="solar:global-outline"
          >Details</UButton
        >
      </UTooltip>
    </div>

    <!-- Progress Bar & Badges -->

    <div v-if="nodeProgress.inPercent" class="px-4">
      <UProgress
        status
        v-model="nodeProgress.inPercent"
        color="secondary"
        class=""
        size="lg"
        :ui="{
          indicator: 'rounded-none bg-blue-700',
          base: 'bg-emerald-700  dark:border border-neutral-800',
          status: 'light:text-slate-600 dark:text-slate-500',
        }"
      />
      <div class="mt-2 flex justify-between">
        <div>
          <UTooltip
            :text="`${dashboardNode.networkInfo.connections_in} nodes have initiated incoming connections to this node.`"
          >
            <div class="cursor-default">
              <UBadge size="lg" class="font-bold mr-2 px-4 bg-blue-700">
                <span class="text-neutral-100">
                  {{ dashboardNode.networkInfo.connections_in }}
                </span>
              </UBadge>
              <span class="">In</span>
            </div>
          </UTooltip>
        </div>
        <div>
          <UTooltip
            :text="`This node has initiated ${dashboardNode.networkInfo.connections_out} connections to other nodes.`"
          >
            <div class="cursor-default">
              <span class="">Out</span>
              <UBadge size="lg" class="font-bold ml-2 px-4 bg-emerald-700">
                <span class="text-neutral-100">{{
                  dashboardNode.networkInfo.connections_out
                }}</span>
              </UBadge>
            </div>
          </UTooltip>
        </div>
      </div>
    </div>

    <divider class="my-4"></divider>

    <!-- Version Info -->

    <div class="p-4 pt-0">
      <div class="text-lg mb-1">Version</div>
      <div class="space-x-2">
        <UBadge color="neutral" variant="soft">
          {{ dashboardNode.networkInfo.version }}
        </UBadge>
        <UBadge color="neutral" variant="soft">
          {{ dashboardNode.networkInfo.subversion }}
        </UBadge>
      </div>
    </div>
  </card-node>
  <card-node v-else header-class="">
    <template #header>
      <div class="flex items-center">
        <div
          class="border-r dark:border-slate-800 light:border-gray-200 bg-red-subtle"
        >
          <div class="rounded-none rounded-tl-lg px-4 h-12 flex items-center">
            <div class="text-center">
              <div class="flex items-center">
                <UChip standalone inset class="mr-2" color="error" />
                <div class="text-xs">Offline</div>
              </div>
            </div>
          </div>
        </div>
        <div class="px-4 truncate w-full">
          {{ dashboardNode.host }}
        </div>
        <div class="border-l dark:border-slate-800 light:border-gray-200">
          <UTooltip text="Edit this nodes name.">
            <UButton
              class="rounded-none rounded-tr-lg h-12"
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
    <div class="p-4 pb-2 flex items-center justify-center">
      <div class="text-center text-slate-500">
        <UIcon
          name="solar:confounded-square-broken"
          size="64"
          class="mt-10"
        ></UIcon>
        <UAlert
          variant="soft"
          color="neutral"
          class="dark:text-slate-400 light:text-slate-500"
          title="Connection Error"
          :description="dashboardNode.error"
        />
      </div>
    </div>
  </card-node>
</template>
