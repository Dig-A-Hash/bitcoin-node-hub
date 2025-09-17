<template>
  <div>
    <!-- <h2>Bitcoin Mempool Visualizer</h2> -->
    <div ref="canvasContainer"></div>
    <!-- <div>Top {{ transactions.length }} out of {{ totalTxCount }}</div> -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import p5 from 'p5';
import type {
  VisualizerData,
  Transaction,
  Block,
} from '~~/shared/types/bitcoinCore';

// State
const transactions = ref<Transaction[]>([]);
const blocks = ref<Block[]>([]);
const totalTxCount = ref(0);
const canvasContainer = ref<HTMLElement | null>(null);
let p5Instance: p5 | null = null;

// Fetch data from API
async function fetchNodeData() {
  try {
    const response = await $fetch<{ success: boolean; data: VisualizerData }>(
      '/api/getVisualizer',
      {
        method: 'POST',
        body: { nodeIndex: 0 },
      }
    );
    if (response.success) {
      // Sort transactions by feePerVbyte descending
      transactions.value = response.data.transactions.sort(
        (a, b) => b.feePerVbyte - a.feePerVbyte
      );
      blocks.value = response.data.blocks;
      totalTxCount.value = response.data.totalTxCount;
    } else {
      console.error('API error:', response);
    }
  } catch (error) {
    console.error('Error fetching visualizer data:', error);
  }
}

// P5.js setup
onMounted(() => {
  if (!canvasContainer.value) return;

  p5Instance = new p5((p: p5) => {
    let txPositions: { tx: Transaction; x: number; y: number; size: number }[] =
      []; // Track positions for clicks

    p.setup = () => {
      const txCount = transactions.value.length || 50; // Default to 50 if empty
      const sideLength = Math.min(
        1000,
        50 + Math.ceil(Math.sqrt(txCount)) * 50
      ); // Square canvas, max 1000px
      p.createCanvas(sideLength, sideLength).parent(canvasContainer.value!);
      p.background(0);
      p.textAlign(p.CENTER);
      p.textSize(12);
    };

    p.draw = () => {
      p.background(0);
      txPositions = []; // Reset positions each frame
      let isHandCursor = false; // Track if cursor should be hand

      // Define gradient colors
      const minFee = 0; // Minimum expected fee rate
      const maxFee = 50; // Maximum expected fee rate (adjust based on your data)
      const colorStart = p.color(0, 153, 255);
      const colorMid1 = p.color(0, 204, 136);
      const colorMid2 = p.color(0, 179, 0);
      const colorEnd = p.color(0, 128, 0);

      // Draw mempool transactions with tight grid packing
      let x = 20;
      let y = 20;
      const gridSize = 10; // Fixed size for consistency, adjust based on vsize range
      const cols = Math.floor((p.width - 40) / gridSize); // Dynamic columns based on canvas width
      transactions.value.forEach((tx, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        x = 20 + col * gridSize;
        y = 20 + row * gridSize;

        // Calculate gradient based on feePerVbyte
        const f = Math.min(maxFee, Math.max(minFee, tx.feePerVbyte)); // Clamp fee rate
        let colorValue;
        if (f < 10) {
          colorValue = p.lerpColor(colorStart, colorMid1, f / 10); // Gray to light green
        } else if (f < 30) {
          colorValue = p.lerpColor(colorMid1, colorMid2, (f - 10) / 20); // Light green to light orange
        } else {
          colorValue = p.lerpColor(colorMid2, colorEnd, (f - 30) / 20); // Light orange to muted red
        }
        p.fill(colorValue);
        p.noStroke();
        p.rect(x, y, gridSize - 2, gridSize - 2); // Slightly smaller for tight packing

        // Track position for click and hover detection
        txPositions.push({ tx, x, y, size: gridSize - 2 });

        // Set cursor to pointer and draw tooltip if over a transaction
        if (
          p.mouseX >= x &&
          p.mouseX <= x + (gridSize - 2) &&
          p.mouseY >= y &&
          p.mouseY <= y + (gridSize - 2)
        ) {
          isHandCursor = true;
          // Draw tooltip with bounds checking
          const tooltipText = [
            `TXID: ${tx.txid.substring(0, 8)}...`,
            `Fee: ${tx.fee} sat`,
            `Vsize: ${tx.vsize} vB`,
            `Fee/byte: ${tx.feePerVbyte.toFixed(2)} sat/vB`,
          ];
          const textWidth =
            Math.max(...tooltipText.map((line) => p.textWidth(line))) + 20; // Padding
          const lineHeight = 15;
          const textHeight = tooltipText.length * lineHeight + 10; // Height with padding
          let tooltipX = p.mouseX - textWidth / 2;
          let tooltipY = p.mouseY - textHeight - 10;

          // Clamp tooltip within canvas
          tooltipX = Math.max(5, Math.min(p.width - textWidth - 5, tooltipX));
          if (tooltipY < 5) tooltipY = p.mouseY + 10; // Flip below if too high

          // Draw tooltip
          p.fill(0, 0, 0, 200); // Semi-transparent black background
          p.stroke(255); // White border
          p.rect(tooltipX, tooltipY, textWidth, textHeight, 5);
          p.fill(255); // White text
          p.noStroke();
          tooltipText.forEach((line, i) => {
            p.text(
              line,
              tooltipX + textWidth / 2,
              tooltipY + 10 + i * lineHeight
            );
          });
        }
      });

      // Reset cursor to default if not over a transaction
      p.cursor(isHandCursor ? p.HAND : p.ARROW);
    };

    // Handle clicks on transactions
    p.mousePressed = () => {
      const mouseX = p.mouseX;
      const mouseY = p.mouseY;
      for (const pos of txPositions) {
        if (
          mouseX >= pos.x &&
          mouseX <= pos.x + pos.size &&
          mouseY >= pos.y &&
          mouseY <= pos.y + pos.size
        ) {
          // Open mempool.space tx details in new tab
          window.open(`https://mempool.space/tx/${pos.tx.txid}`, '_blank');
          break; // Only open one if multiple overlap (unlikely)
        }
      }
    };
  }, canvasContainer.value);

  // Fetch initial data and set up polling
  fetchNodeData();
});
const interval = setInterval(fetchNodeData, 15000);
// Clean up on unmount
onBeforeUnmount(() => {
  if (p5Instance) {
    clearInterval(interval); // Ensure interval is cleared
    p5Instance.remove();
    p5Instance = null;
  }
});
</script>

<style scoped>
div {
  text-align: center;
}
h2 {
  color: white;
  font-family: Arial, sans-serif;
}
</style>
