<template>
  <div>
    <svg ref="svgRef" width="1000" height="1000"></svg>
    <div>Total Transactions: {{ totalTxCount }}</div>
    <div>Displayed Transactions: {{ transactions.length }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as d3 from 'd3';
import type {
  VisualizerData,
  Transaction,
  Block,
} from '~~/shared/types/bitcoinCore';

// State
const transactions = ref<Transaction[]>([]);
const blocks = ref<Block[]>([]);
const totalTxCount = ref<number>(0);
const svgRef = ref<SVGSVGElement | null>(null);

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
      transactions.value = response.data.transactions;
      blocks.value = response.data.blocks;
      totalTxCount.value = response.data.totalTxCount;
    } else {
      console.error('API error:', response);
    }
  } catch (error) {
    console.error('Error fetching visualizer data:', error);
  }
}

onMounted(async () => {
  await fetchNodeData(); // Fetch data on mount
  renderTreemap();
  setInterval(fetchNodeData, 15000); // Poll every 15s
});

function renderTreemap() {
  if (!svgRef.value || transactions.value.length === 0) return;

  const svg = d3.select(svgRef.value);
  svg.selectAll('*').remove(); // Clear previous render

  const width = 1000;
  const height = 1000;

  // Normalize vsize for sizing
  const totalVsize = d3.sum(transactions.value, (d) => d.vsize);

  // Create hierarchy for treemap (flat data wrapped in root)
  const root = d3
    .hierarchy({ children: transactions.value })
    .sum((d) => (d.vsize / totalVsize) * width * height) // Area proportional to vsize
    .sort((a, b) => b.data.feePerVbyte - a.data.feePerVbyte); // Sort by descending fee rate

  // Treemap layout (squarified to mimic mempool.space)
  const treemap = d3.treemap().size([width, height]).padding(1).round(true);

  treemap(root);

  // Color scale based on feePerVbyte (your gradient)
  const color = d3
    .scaleLinear()
    .domain([0, 10, 30, 50]) // Buckets
    .range(['#ffff1a', '#b3ff66', '#00b300', '#008000']); // Your colors: yellow to dark green

  // Draw rectangles
  svg
    .selectAll('rect')
    .data(root.leaves())
    .enter()
    .append('rect')
    .attr('x', (d) => d.x0)
    .attr('y', (d) => d.y0)
    .attr('width', (d) => d.x1 - d.x0)
    .attr('height', (d) => d.y1 - d.y0)
    .attr('fill', (d) => color(d.data.feePerVbyte))
    .on('mouseover', function (event, d) {
      d3.select(this).attr('stroke', '#fff').attr('stroke-width', 2);
      showTooltip(event, d.data);
    })
    .on('mouseout', function () {
      d3.select(this).attr('stroke', none);
      hideTooltip();
    })
    .on('click', function (event, d) {
      window.open(`https://mempool.space/tx/${d.data.txid}`, '_blank');
    });

  // Tooltip function
  const tooltip = d3
    .select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)
    .style('position', 'absolute')
    .style('background', 'rgba(0, 0, 0, 0.8)')
    .style('color', '#fff')
    .style('padding', '5px')
    .style('border-radius', '5px')
    .style('pointer-events', 'none');

  function showTooltip(event, data) {
    tooltip.transition().duration(200).style('opacity', 1);
    tooltip
      .html(
        `
      TXID: ${data.txid.substring(0, 8)}...<br>
      Fee: ${data.fee} sat<br>
      Vsize: ${data.vsize} vB<br>
      Fee/byte: ${data.feePerVbyte.toFixed(2)} sat/vB
    `
      )
      .style('left', event.pageX + 10 + 'px')
      .style('top', event.pageY + 10 + 'px');
  }

  function hideTooltip() {
    tooltip.transition().duration(200).style('opacity', 0);
  }
}
</script>

<style scoped>
.tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 5px;
  border-radius: 5px;
  pointer-events: none;
}
</style>
