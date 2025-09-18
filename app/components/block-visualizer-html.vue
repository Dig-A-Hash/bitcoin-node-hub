<template>
  <div class="flex flex-col md:flex-row gap-2 p-2 font-sans">
    <!-- Main 40x40 Grid for High-Priority Transactions -->
    <card-tile class="flex-1">
      <div
        class="flex flex-row flex-wrap space-x-0.5 space-y-0.5 p-2 overflow-y-auto w-full"
      >
        <template v-for="tx in visualizerData.transactions" :key="tx.txid">
          <UPopover mode="hover">
            <div
              :class="getBlockColor(tx.feePerVbyte)"
              class="w-3 h-3 cursor-pointer"
              @click="openTxDetails(tx.txid)"
            ></div>
            <template #content> yoyoyo </template>
          </UPopover>
        </template>
      </div>
      <div class="mt-2 text-sm text-gray-400">
        Showing {{ visualizerData.transactions.length }} of
        {{ visualizerData.totalTxCount }} transactions
      </div>
    </card-tile>

    <!-- Sidebar for Low-Priority Categories -->
    <div class="flex flex-col gap-2 w-full md:w-64">
      <card-tile
        v-for="(category, key) in visualizerData.lowPriorityCategories"
        :key="key"
      >
        <UPopover mode="hover">
          <template #content>
            {{ getCategoryTooltip(category, key) }}
          </template>
          <div class="p-2 text-sm">
            <h3 class="font-semibold capitalize">
              {{ key.replace(/([A-Z])/g, ' $1').trim() }}
            </h3>
            <p>{{ category.count }} txs</p>
            <p>{{ (category.totalVsize / 1000).toFixed(1) }} kB</p>
          </div>
        </UPopover>
      </card-tile>
    </div>
  </div>
</template>

<script setup lang="ts">
// Color constants for transaction blocks
const LOW_FEE_COLOR = 'bg-blue-600';
const MEDIUM_LOW_FEE_COLOR = 'bg-cyan-500';
const MEDIUM_HIGH_FEE_COLOR = 'bg-orange-500';
const HIGH_FEE_COLOR = 'bg-yellow-400';

import { ref } from 'vue';
import type {
  VisualizerData,
  LowPriorityCategory,
} from '../../shared/types/bitcoinCore';

const visualizerData = ref<VisualizerData>({
  transactions: [],
  blocks: [],
  totalTxCount: 0,
  lowPriorityCategories: {
    lowFee: { count: 0, totalVsize: 0, avgFeePerVbyte: 0 },
    dust: { count: 0, totalVsize: 0, avgFeePerVbyte: 0 },
    ordinals: { count: 0, totalVsize: 0, avgFeePerVbyte: 0 },
    anomalous: { count: 0, totalVsize: 0, avgFeePerVbyte: 0 },
  },
});

// Fetch data from API
async function fetchVisualizerData() {
  try {
    const response = await $fetch<{ success: boolean; data: VisualizerData }>(
      '/api/getVisualizer2',
      {
        method: 'POST',
        body: { nodeIndex: 0 },
      }
    );
    if (response.success) {
      visualizerData.value = response.data;
    } else {
      console.error('API error:', response);
    }
  } catch (error) {
    console.error('Error fetching visualizer data:', error);
  }
}

// Color logic for transaction blocks
function getBlockColor(feePerVbyte: number): string {
  if (feePerVbyte < 5) return LOW_FEE_COLOR;
  if (feePerVbyte < 15) return MEDIUM_LOW_FEE_COLOR;
  if (feePerVbyte < 25) return MEDIUM_HIGH_FEE_COLOR;
  return HIGH_FEE_COLOR;
}

// Tooltip content for transactions
function getTxTooltip(tx: Transaction): string {
  return [
    `TXID: ${tx.txid.substring(0, 8)}...`,
    `Fee: ${tx.fee.toFixed(0)} sat`,
    `Vsize: ${tx.vsize} vB`,
    `Fee/vB: ${tx.feePerVbyte.toFixed(2)} sat/vB`,
    `Age: ${Math.floor((Date.now() / 1000 - tx.time) / 60)} min ago`,
  ].join('\n');
}

// Tooltip content for categories
function getCategoryTooltip(
  category: LowPriorityCategory,
  key: string
): string {
  return [
    `Category: ${key.replace(/([A-Z])/g, ' $1').trim()}`,
    `Count: ${category.count} txs`,
    `Total Vsize: ${(category.totalVsize / 1000).toFixed(1)} kB`,
    `Avg Fee/vB: ${category.avgFeePerVbyte.toFixed(2)} sat/vB`,
    category.exampleTxid
      ? `Example TXID: ${category.exampleTxid.substring(0, 8)}...`
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}

// Open transaction details in block explorer
function openTxDetails(txid: string) {
  window.open(`https://mempool.space/tx/${txid}`, '_blank');
}

// Poll every 20 seconds
const interval = ref<NodeJS.Timeout | null>(null);
onMounted(() => {
  fetchVisualizerData();
  interval.value = setInterval(fetchVisualizerData, 5000);
});
onBeforeUnmount(() => {
  if (interval.value) clearInterval(interval.value);
});
</script>
