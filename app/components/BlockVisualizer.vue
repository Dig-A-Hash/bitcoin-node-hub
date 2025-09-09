<template>
  <div>
    <h2>Bitcoin Mempool Visualizer</h2>
    <div ref="canvasContainer"></div>
  </div>
</template>

<script>
import * as p5 from 'p5';
import * as Mempool from '@mempool/mempool.js';

export default {
  data() {
    return {
      transactions: [],
      blocks: [],
      mempool: null,
      p5Instance: null,
    };
  },
  async mounted() {
    // Initialize mempool.js
    this.mempool = Mempool({
      hostname: 'mempool.space',
      network: 'mainnet',
    });

    // Create P5.js sketch
    this.p5Instance = new p5((p) => {
      p.setup = () => {
        p.createCanvas(800, 600).parent(this.$refs.canvasContainer);
        p.background(0);
      };
      p.draw = () => {
        p.background(0);
        // Draw transactions
        this.transactions.forEach((tx, index) => {
          const size = Math.min(Math.max(tx.fee / 1000, 10), 100);
          const x = (index % 10) * 80 + 40;
          const y = Math.floor(index / 10) * 80 + 40;
          p.fill(100 + tx.feePerVbyte, 255 - tx.feePerVbyte, 100);
          p.noStroke();
          p.rect(x, y, size, size);
          // Animate
          p.push();
          p.translate(x, y);
          p.rotate(p.frameCount * 0.02);
          p.rect(0, 0, size * 0.5, size * 0.5);
          p.pop();
        });
        // Draw blocks
        this.blocks.forEach((block, index) => {
          const x = 600 + index * 50;
          const y = 50;
          p.fill(255, 165, 0);
          p.rect(x, y, 40, 40);
        });
      };
    }, this.$refs.canvasContainer);

    // Fetch mempool data
    await this.fetchMempoolData();
    setInterval(this.fetchMempoolData, 15000);
  },
  beforeUnmount() {
    // Clean up P5.js instance
    if (this.p5Instance) {
      this.p5Instance.remove();
    }
  },
  methods: {
    async fetchMempoolData() {
      try {
        const { transactions } =
          await this.mempool.bitcoin.mempool.getMempool();
        this.transactions = transactions.slice(0, 50);
        const { blocks } = await this.mempool.bitcoin.blocks.getBlocks({
          index: 0,
        });
        this.blocks = blocks.slice(0, 5);
      } catch (error) {
        console.error('Error fetching mempool data:', error);
      }
    },
  },
};
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
