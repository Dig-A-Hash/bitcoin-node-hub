<script setup lang="ts">
const route = useRoute();
const nodeIndex = parseInt(route.query.i ? route.query.i.toString() : '0');

// Color constants for transaction blocks
const LOW_FEE_COLOR = 'bg-blue-600';
const MEDIUM_LOW_FEE_COLOR = 'bg-cyan-500';
const MEDIUM_HIGH_FEE_COLOR = 'bg-yellow-400';
const HIGH_FEE_COLOR = 'bg-orange-500';
const textDataSize = 'text-2xl';

import { ref, watch } from 'vue';
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

// Timer logic
const BLOCK_TIME_SECONDS = 600; // 10 minutes
const timeRemaining = ref(BLOCK_TIME_SECONDS);
const lastBlockHeight = ref(0);
const progressValue = ref(0);

function updateProgress() {
  progressValue.value = Math.max(
    0,
    ((BLOCK_TIME_SECONDS - timeRemaining.value) / BLOCK_TIME_SECONDS) * 100
  );
}

function resetTimer(blockTime?: number) {
  if (blockTime) {
    const elapsedSeconds = Math.floor(Date.now() / 1000 - blockTime);
    timeRemaining.value = Math.max(0, BLOCK_TIME_SECONDS - elapsedSeconds);
  } else {
    timeRemaining.value = BLOCK_TIME_SECONDS;
  }
  updateProgress();
}

watch(
  () => visualizerData.value.blocks[0]?.height,
  (newHeight, oldHeight) => {
    if (newHeight && newHeight !== oldHeight) {
      lastBlockHeight.value = newHeight;
      resetTimer(visualizerData.value.blocks[0]?.time);
    }
  }
);

const timerInterval = ref<NodeJS.Timeout | null>(null);
onMounted(() => {
  fetchVisualizerData(); // Fetch data first to get block timestamp
  timerInterval.value = setInterval(() => {
    timeRemaining.value = Math.max(-Infinity, timeRemaining.value - 1);
    updateProgress();
  }, 1000);
});

// Fetch data from API
async function fetchVisualizerData() {
  try {
    const response = await $fetch<{ success: boolean; data: VisualizerData }>(
      '/api/getVisualizer',
      {
        method: 'POST',
        body: { nodeIndex },
      }
    );
    if (response.success) {
      visualizerData.value = response.data;
      // Initialize timer with latest block time on first fetch
      if (visualizerData.value.blocks[0]?.time && lastBlockHeight.value === 0) {
        lastBlockHeight.value = visualizerData.value.blocks[0].height;
        resetTimer(visualizerData.value.blocks[0].time);
      }
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

// Open transaction details in block explorer
function openTxDetails(txid: string) {
  window.open(`https://mempool.space/tx/${txid}`, '_blank');
}

const formattedTime = computed(() => {
  const minutes = Math.floor(timeRemaining.value / 60);
  const seconds = (timeRemaining.value % 60).toString().padStart(2, '0');

  if (minutes < 0) {
    return `- ${minutes * -1 - 1}:${parseInt(seconds) * -1}`;
  } else {
    return `${minutes}:${seconds}`;
  }
});

// Poll every 20 seconds
const interval = ref<NodeJS.Timeout | null>(null);

onMounted(() => {
  interval.value = setInterval(fetchVisualizerData, 20000);
});

onBeforeUnmount(() => {
  if (interval.value) clearInterval(interval.value);
  if (timerInterval.value) clearInterval(timerInterval.value);
});
</script>

<template>
  {{ visualizerData.blocks[0]?.height }}
  <div class="flex flex-col md:flex-row gap-2 p-2 font-sans">
    <!-- Main 40x40 Grid for High-Priority Transactions -->
    <card-tile class="flex-1">
      <div class="p-4 h-90">
        <div
          class="flex flex-row flex-wrap space-x-1 space-y-1 overflow-y-auto w-full max-h-84"
        >
          <template v-for="tx in visualizerData.transactions" :key="tx.txid">
            <UPopover mode="hover" :open-delay="500">
              <div
                :class="getBlockColor(tx.feePerVbyte)"
                class="w-3 h-3 cursor-pointer rounded-xs"
                @click="openTxDetails(tx.txid)"
              ></div>
              <template #content>
                <div class="p-4 text-sm">
                  <div>TXID: {{ tx.txid.substring(0, 8) }}...</div>
                  <div>Fee: {{ tx.fee.toFixed(0) }} sat</div>
                  <div>Vsize: {{ tx.vsize }} vB</div>
                  <div>Fee/vB: {{ tx.feePerVbyte.toFixed(2) }} sat/vB</div>
                  <div>
                    Age:
                    {{ Math.floor((Date.now() / 1000 - tx.time) / 60) }} min ago
                  </div>
                </div>
              </template>
            </UPopover>
          </template>
        </div>
      </div>
      <template #footer>
        <div class="p-2 text-sm text-gray-400">
          Showing {{ visualizerData.transactions.length }} of
          {{ visualizerData.totalTxCount }} transactions
        </div>
      </template>
    </card-tile>

    <!-- Sidebar for Low-Priority Categories and Timer -->
    <div class="flex flex-col gap-2 w-full md:w-64">
      <card-tile>
        <!-- Low Fee -->

        <div class="p-2">
          <div :class="textDataSize" class="flex justify-between items-center">
            <div>
              {{ visualizerData.lowPriorityCategories.lowFee.count }}
            </div>
            <span class="text-sm">
              {{
                (
                  visualizerData.lowPriorityCategories.lowFee.totalVsize / 1000
                ).toFixed(1)
              }}
              kB
            </span>
          </div>
          <div class="text-gray-500">Low Fee</div>
        </div>
      </card-tile>

      <!-- Dust -->

      <card-tile>
        <div class="p-2">
          <div :class="textDataSize" class="flex justify-between items-center">
            <div>
              {{ visualizerData.lowPriorityCategories.dust.count }}
            </div>
            <span class="text-sm">
              {{
                (
                  visualizerData.lowPriorityCategories.dust.totalVsize / 1000
                ).toFixed(1)
              }}
              kB
            </span>
          </div>
          <div class="text-gray-500">Dust</div>
        </div>
      </card-tile>

      <!-- Ordinals -->

      <card-tile>
        <div class="p-2">
          <div :class="textDataSize" class="flex justify-between items-center">
            <div>
              {{ visualizerData.lowPriorityCategories.ordinals.count }}
            </div>
            <span class="text-sm">
              {{
                (
                  visualizerData.lowPriorityCategories.ordinals.totalVsize /
                  1000
                ).toFixed(1)
              }}
              kB
            </span>
          </div>
          <div class="text-gray-500">Ordinals & Inscriptions</div>
        </div>
      </card-tile>

      <!-- Ordinals -->

      <card-tile>
        <div class="p-2">
          <div :class="textDataSize" class="flex justify-between items-center">
            <div>
              {{ visualizerData.lowPriorityCategories.anomalous.count }}
            </div>
            <span class="text-sm">
              {{
                (
                  visualizerData.lowPriorityCategories.anomalous.totalVsize /
                  1000
                ).toFixed(1)
              }}
              kB
            </span>
          </div>
          <div class="text-gray-500">Other</div>
        </div>
      </card-tile>

      <!-- Timer Card -->

      <card-tile>
        <div class="p-2">
          <p :class="textDataSize">
            {{ formattedTime }}
          </p>
          <div class="text-gray-500">Time to Next Block</div>
          <UProgress
            v-model="progressValue"
            color="warning"
            size="sm"
            class="mt-2"
          />
        </div>
      </card-tile>
    </div>
  </div>
</template>
