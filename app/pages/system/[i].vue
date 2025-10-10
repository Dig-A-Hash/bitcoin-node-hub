<script setup lang="ts">
const nodeInfo = ref<NodeInfo>();
const bitcoinStore = useBitcoin();
const { formatBytes, formatTimestamp } = useTextFormatting();
const { navigateToPeers } = useHelpers();
const route = useRoute();
const nodeIndex = parseInt(route.params.i?.toString() || '');
const isLocalAddressesDrawerOpen = ref(false);
const isLocalServicesDrawerOpen = ref(false);
const isLoading = ref(false);
const isError = ref(false);
const textDataSize = 'text-2xl';

// Fetch data
async function fetchNodeInfo() {
  try {
    isLoading.value = true;
    const response = await $fetch<ApiResponse<NodeInfo>>('/api/getNodeInfo', {
      method: 'POST',
      body: { nodeIndex },
    });
    if (response.success && response.data) {
      nodeInfo.value = response.data;
    }
  } catch (error) {
    console.error('Error fetching:', error);
    isError.value = true;
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  await fetchNodeInfo();
});
</script>

<template>
  <UContainer class="mt-4">
    <h1 class="text-xl mb-4 text-white flex justify-between items-center">
      <span> System Info </span>
      <UBadge
        size="xl"
        class="ml-4"
        color="primary"
        icon="material-symbols:network-node"
        variant="subtle"
      >
        {{ bitcoinStore.nodeNames[nodeIndex]?.name }}
      </UBadge>
    </h1>
    <div v-if="nodeInfo && !isLoading" class="space-y-4 mb-4">
      <!-- Node Overview -->
      <card-subtle class=" ">
        <template #header>
          <div class="flex items-center justify-between p-2 px-4">
            <h2 class="text-lg">
              {{ nodeInfo.name || 'Unnamed Node' }}
            </h2>
            <UBadge :color="nodeInfo.error ? 'error' : 'success'">
              {{ nodeInfo.error || 'Active' }}
            </UBadge>
          </div>
        </template>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2">
          <card-tile>
            <div class="p-4">
              <p :class="textDataSize">{{ nodeInfo.host }}</p>
              <p class="text-gray-500">Host</p>
            </div>
          </card-tile>
          <card-tile>
            <div class="p-4">
              <p :class="textDataSize">
                {{ nodeInfo.networkInfo.localaddresses[0]?.score }}
              </p>
              <p class="text-gray-500">Reliability Score</p>
            </div>
          </card-tile>
          <card-tile>
            <div class="p-4">
              <p :class="textDataSize">
                {{ nodeInfo.blockchainInfo.chain }}
              </p>
              <p class="text-gray-500">Chain</p>
            </div>
          </card-tile>

          <div class="sm:col-span-2">
            <div class="text-xl space-x-2">
              <UBadge color="neutral" variant="subtle">Version:</UBadge>
              <UBadge color="neutral" variant="subtle">{{
                nodeInfo.networkInfo.subversion
              }}</UBadge>
              <UBadge color="neutral" variant="subtle">{{
                nodeInfo.networkInfo.version
              }}</UBadge>
            </div>
          </div>
        </div>
      </card-subtle>

      <!-- Network Info -->

      <div class="grid grid-cols-1 gap-4">
        <card-subtle class="">
          <template #header>
            <div class="p-2 px-4">
              <h3 class="text-lg font-medium">Network Info</h3>
            </div>
          </template>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2">
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ nodeInfo.networkInfo.version }}
                </div>
                <div class="text-gray-500">Version</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ nodeInfo.networkInfo.protocolversion }}
                </div>
                <div class="text-gray-500">Protocol Version</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div class="mb-1.5">
                  <UBadge variant="subtle" class="" color="neutral">{{
                    nodeInfo.networkInfo.subversion
                  }}</UBadge>
                </div>
                <div class="text-gray-500">Sub Version</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ formatBytes(nodeInfo.netTotals.totalbytessent) }}
                </div>
                <div class="text-gray-500">Bytes Sent</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ formatBytes(nodeInfo.netTotals.totalbytesrecv) }}
                </div>
                <div class="text-gray-500">Bytes Received</div>
              </div>
            </card-tile>

            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ nodeInfo.networkInfo.connections }}
                </div>
                <div class="text-gray-500">Connections</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ nodeInfo.networkInfo.connections_in }}
                </div>
                <div class="text-gray-500">Incoming Connections</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ nodeInfo.networkInfo.connections_out }}
                </div>
                <div class="text-gray-500">Outgoing Connections</div>
              </div>
            </card-tile>

            <card-tile-button @click="navigateToPeers(nodeIndex)">
              <div>
                <UIcon name="solar:global-outline" size="22"></UIcon>
              </div>
              <div>Connection Map</div>
            </card-tile-button>
            <card-tile-button @click="isLocalAddressesDrawerOpen = true">
              <div>
                <UIcon name="material-symbols:in-home-mode" size="22"></UIcon>
              </div>
              <div>Local Addresses</div>
            </card-tile-button>
            <card-tile-button @click="isLocalServicesDrawerOpen = true">
              <div>
                <UIcon name="material-symbols:bolt" size="22"></UIcon>
              </div>
              <div>Local Services</div>
            </card-tile-button>
          </div>
        </card-subtle>

        <!-- Blockchain Info -->

        <card-subtle class="">
          <template #header>
            <div class="p-4">
              <h3 class="text-lg font-medium">Blockchain Info</h3>
            </div>
          </template>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2">
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ nodeInfo.blockchainInfo.blocks }}
                </div>
                <div class="text-gray-500">Blocks</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ nodeInfo.difficulty }}
                </div>
                <div class="text-gray-500">Difficulty</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ formatBytes(nodeInfo.blockchainInfo.size_on_disk) }}
                </div>
                <div class="text-gray-500">Size on Disk</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{
                    nodeInfo.blockchainInfo.initialblockdownload ? 'Yes' : 'No'
                  }}
                </div>
                <div class="text-gray-500">
                  Initial Block Download (IBD) Mode
                </div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ nodeInfo.blockchainInfo.verificationprogress.toFixed(2) }}%
                </div>
                <div class="text-gray-500">Sync Progress</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ nodeInfo.blockchainInfo.pruned ? 'Yes' : 'No' }}
                </div>
                <div class="text-gray-500">Pruned</div>
              </div>
            </card-tile>
          </div>
        </card-subtle>

        <!-- Mempool -->

        <card-subtle class="">
          <template #header>
            <div class="p-4">
              <h3 class="text-lg font-medium">Mempool Info</h3>
            </div>
          </template>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2">
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ nodeInfo.mempoolInfo.size }}
                </div>
                <div class="text-gray-500">Transactions</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ formatBytes(nodeInfo.mempoolInfo.bytes) }}
                </div>
                <div class="text-gray-500">Size</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ nodeInfo.mempoolInfo.total_fee.toFixed(8) }} BTC
                </div>
                <div class="text-gray-500">Total Fee</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ nodeInfo.mempoolInfo.mempoolminfee.toFixed(8) }}
                  BTC/kB
                </div>
                <div class="text-gray-500">Min Fee Rate</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ nodeInfo.mempoolInfo.rbf_policy }}
                </div>
                <div class="text-gray-500">RBF Policy</div>
              </div>
            </card-tile>
          </div>
        </card-subtle>
      </div>

      <!-- Mining Info -->

      <div class="grid grid-cols-1 gap-4">
        <card-subtle class="">
          <template #header>
            <div class="p-4">
              <h3 class="text-lg font-medium">Mining Info</h3>
            </div>
          </template>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2">
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{
                    formatBytes(parseFloat(nodeInfo.miningInfo.networkhashps))
                  }}
                  H/s
                </div>
                <div class="text-gray-500">Network Hash Rate</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ parseFloat(nodeInfo.miningInfo.difficulty).toFixed(2) }}
                </div>
                <div class="text-gray-500">Difficulty</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ nodeInfo.miningInfo.pooledtx }}
                </div>
                <div class="text-gray-500">Pooled Transactions</div>
              </div>
            </card-tile>
            <card-tile>
              <div class="p-4">
                <div :class="textDataSize">
                  {{ nodeInfo.miningInfo.warnings || 'None' }}
                </div>
                <div class="text-gray-500">Warnings</div>
              </div>
            </card-tile>
          </div>
        </card-subtle>
      </div>

      <!-- Memory Info -->

      <card-subtle class="">
        <template #header>
          <div class="p-4">
            <h3 class="text-lg font-medium">Memory Info</h3>
          </div>
        </template>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2">
          <card-tile>
            <div class="p-4">
              <div :class="textDataSize">
                {{ formatBytes(nodeInfo.memoryInfo.locked.used) }}
              </div>
              <div class="text-gray-500">Used Memory</div>
            </div>
          </card-tile>
          <card-tile>
            <div class="p-4">
              <div :class="textDataSize">
                {{ formatBytes(nodeInfo.memoryInfo.locked.free) }}
              </div>
              <div class="text-gray-500">Free Memory</div>
            </div>
          </card-tile>
          <card-tile>
            <div class="p-4">
              <div :class="textDataSize">
                {{ formatBytes(nodeInfo.memoryInfo.locked.total) }}
              </div>
              <div class="text-gray-500">Total Memory</div>
            </div>
          </card-tile>
          <card-tile>
            <div class="p-4">
              <div :class="textDataSize">
                {{ nodeInfo.memoryInfo.locked.chunks_used }} /
                {{ nodeInfo.memoryInfo.locked.chunks_free }}
              </div>
              <div class="text-gray-500">Chunks Used/Free</div>
            </div>
          </card-tile>
        </div>
      </card-subtle>
    </div>

    <div v-else-if="isLoading" class="max-w-md p-8 mx-auto mt-12 text-center">
      <UProgress class="mb-2" color="warning"></UProgress>
      Loading Node Info...
    </div>

    <div v-else-if="isError" class="max-w-md p-8 mx-auto mt-12 text-center">
      <UAlert
        color="error"
        title="Error"
        description="There was an error fetching the data for this node."
      />
    </div>
  </UContainer>
  <USlideover
    v-model:open="isLocalAddressesDrawerOpen"
    aria-describedby="Local Addresses"
    direction="right"
    :overlay="false"
    title="Local Addresses"
    description="A list of addresses this node is listening on."
    :modal="false"
    class="w-full max-w-md"
  >
    <template #body>
      <div v-if="nodeInfo">
        <card-tile
          class="dark:bg-black/20"
          v-for="(item, index) in nodeInfo.networkInfo.localaddresses"
        >
          <div class="p-4">
            <div :class="textDataSize">{{ item.address }}:{{ item.port }}</div>
            <div class="text-gray-500">Address</div>
            <divider class="my-3"></divider>
            <div :class="textDataSize">
              {{ item.score }}
            </div>
            <div class="text-gray-500">Reliability Score</div>
          </div>
        </card-tile>
      </div>
    </template>
  </USlideover>
  <USlideover
    v-model:open="isLocalServicesDrawerOpen"
    aria-describedby="Local Services"
    direction="right"
    :overlay="false"
    title="Local Services"
    description="A list of Bitcoin services advertised on this node."
    :modal="false"
    class="w-full max-w-md"
  >
    <template #body>
      <div v-if="nodeInfo" class="space-y-2">
        <card-tile
          class="dark:bg-black/20"
          v-for="(item, index) in nodeInfo.networkInfo.localservicesnames"
        >
          <div class="p-4">
            <div :class="textDataSize">{{ item }}</div>
            <div class="text-gray-500">Service</div>
            <div class="text-sm mt-1" v-if="item === 'NETWORK'">
              Enables the node to relay transactions and blocks to other nodes,
              acting as a full participant in the Bitcoin network.
            </div>
            <div class="text-sm mt-1" v-if="item === 'WITNESS'">
              Supports Segregated Witness (SegWit), allowing the node to handle
              transactions with witness data for improved scalability and
              security.
            </div>
            <div class="text-sm mt-1" v-if="item === 'NETWORK_LIMITED'">
              Supports serving the most recent 288 blocks to peers, typically
              for lightweight clients. If listed without NETWORK, it implies a
              pruned node with restricted blockchain storage.
            </div>
            <div class="text-sm mt-1" v-if="item === 'P2P_V2'">
              Supports the BIP324 peer-to-peer v2 protocol, which enhances
              connection security and efficiency with encrypted communication
              between nodes.
            </div>
            <div class="text-sm mt-1" v-if="item === 'BLOOM'">
              Supports BIP37 bloom filtering, allowing lightweight clients
              (e.g., SPV wallets) to request specific transaction data from the
              node.
            </div>
            <div class="text-sm mt-1" v-if="item === 'COMPACT_FILTERS'">
              Provides support for BIP157/158 compact block filters, enabling
              lightweight clients to sync and verify transactions efficiently.
            </div>
            <div class="text-sm mt-1" v-if="item === 'ADDR_V2'">
              Advertises support for BIP155 address format v2, which allows
              relaying of non-standard address types, such as those used in
              future upgrades.
            </div>
            <div class="text-sm mt-1" v-if="item === 'WTXID_RELAY'">
              Supports relaying transactions using witness transaction IDs
              (wtxids), enabling compatibility with SegWit and other advanced
              features.
            </div>
            <div class="text-sm mt-1" v-if="item === 'REPLACE_BY_FEE?'">
              Indicates potential support for Replace-By-Fee (RBF), allowing the
              node to replace unconfirmed transactions with higher-fee versions
              (presence of "?" suggests conditional or unclear support in the
              context).
            </div>
          </div>
        </card-tile>
      </div>
    </template>
  </USlideover>
</template>
