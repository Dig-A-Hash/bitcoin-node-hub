<script setup lang="ts">
import type { SelectMenuItem } from '@nuxt/ui';
import type { ApiResponse } from '../../shared/types/apiResponse';

const { selectedPeer, nodeIndex } = defineProps<{
  selectedPeer: PeerInfo & { geo?: GeoIpResponse };
  nodeIndex: number;
}>();

const showModal = ref(false);
const toast = useToast();
const { formatTimestamp, formatBytes, formatIpNoPort } = useTextFormatting();

const emit = defineEmits<{
  (e: 'update'): void;
}>();

const selectedBanLengthSeconds = ref(3600);
const isBanLoading = ref(false);

async function banPeer() {
  showModal.value = true;
}

async function confirmBan() {
  try {
    isBanLoading.value = true;
    const ipOnly = formatIpNoPort(selectedPeer.addr);
    const response = await $fetch<ApiResponse>('/api/setBan', {
      method: 'POST',
      body: {
        nodeIndex,
        ipAddress: ipOnly,
        banTime: selectedBanLengthSeconds.value,
      },
      parseResponse: JSON.parse,
    });

    setTimeout(() => {
      toast.add({
        id: 'ban-success',
        title: 'Peer Banned',
        description: `Successfully banned peer at ${ipOnly}`,
        color: 'success',
      });
      emit('update');
      showModal.value = false;
      isBanLoading.value = true;
    }, 1000);
  } catch (error) {
    console.error(`Error:`, error);
    toast.add({
      id: 'ban-error',
      title: 'Ban Failed',
      description: 'Failed to ban peer',
      color: 'error',
    });
    showModal.value = false;
    isBanLoading.value = true;
  }
}

interface BanLengthItem {
  id: number;
  label: string;
}

const banLengthItems = ref<BanLengthItem[]>([
  {
    label: '1 Hour',
    id: 3600,
  },
  {
    label: '12 Hours',
    id: 43200,
  },
  {
    label: '1 Day',
    id: 86400,
  },
  {
    label: '1 Week',
    id: 604800,
  },
  {
    label: '1 Month',
    id: 2628000,
  },
  {
    label: '1 Year',
    id: 31536000,
  },
  {
    label: '100 Years',
    id: 3155760000,
  },
]);
</script>
<template>
  <div class="">
    <div v-if="selectedPeer">
      <div class="grid grid-cols-1 gap-3 p-4 pt-0 text-sm">
        <div class="flex justify-between items-center">
          <span class="font-medium text-gray-700 dark:text-gray-300"
            >Peer ID</span
          >
          <UBadge
            :color="selectedPeer.inbound ? 'warning' : 'secondary'"
            variant="subtle"
            size="lg"
            >{{ selectedPeer.id }}</UBadge
          >
        </div>
        <div class="flex justify-between">
          <span class="font-medium text-gray-700 dark:text-gray-300"
            >Address</span
          >
          <UBadge
            :color="selectedPeer.inbound ? 'warning' : 'secondary'"
            variant="subtle"
            size="lg"
            class="max-w-52 overflow-hidden"
          >
            {{ selectedPeer.addr }}</UBadge
          >
        </div>
        <div class="flex justify-between">
          <span class="font-medium text-gray-700 dark:text-gray-300"
            >Connection Type</span
          >
          <UBadge
            :color="selectedPeer.inbound ? 'warning' : 'secondary'"
            variant="subtle"
            size="lg"
            >{{ selectedPeer.connection_type || 'N/A' }}</UBadge
          >
        </div>
        <div class="flex justify-between">
          <span class="font-medium text-gray-700 dark:text-gray-300"
            >Inbound</span
          >
          <UBadge
            :color="selectedPeer.inbound ? 'warning' : 'secondary'"
            variant="subtle"
            size="lg"
            >{{ selectedPeer.inbound ? 'True' : 'False' }}</UBadge
          >
        </div>
      </div>

      <divider class="mb-4"></divider>

      <UTabs
        :items="[
          { label: 'Network', slot: 'network' },
          { label: 'Blockchain', slot: 'blockchain' },
          { label: 'Traffic', slot: 'traffic' },
          { label: 'Geo', slot: 'geo' },
        ]"
        :color="selectedPeer.inbound ? 'warning' : 'secondary'"
        class=""
      >
        <template #network>
          <card-subtle>
            <div class="grid grid-cols-1 gap-3 p-4 text-sm">
              <div class="flex justify-between">
                <span class="font-medium text-gray-700 dark:text-gray-300"
                  >Network Type</span
                >
                <span>{{ selectedPeer.network }}</span>
              </div>
              <USeparator></USeparator>
              <div class="flex justify-between">
                <span class="font-medium text-gray-700 dark:text-gray-300"
                  >Services</span
                >
                <span class="max-w-52 text-right text-xs">
                  {{ selectedPeer.servicesnames?.join(', ') || 'N/A' }}
                </span>
              </div>
              <USeparator></USeparator>
              <div class="flex justify-between">
                <span class="font-medium text-gray-700 dark:text-gray-300"
                  >Software Version</span
                >
                <span class="max-w-52 text-right">{{
                  selectedPeer.subver || 'N/A'
                }}</span>
              </div>
              <USeparator></USeparator>
              <div class="flex justify-between">
                <span class="font-medium text-gray-700 dark:text-gray-300"
                  >Protocol Version</span
                >
                <span>{{ selectedPeer.version || 'N/A' }}</span>
              </div>
              <USeparator></USeparator>
              <div class="flex justify-between">
                <span class="font-medium text-gray-700 dark:text-gray-300"
                  >Transport Protocol</span
                >
                <span>{{ selectedPeer.transport_protocol_type || 'N/A' }}</span>
              </div>
            </div>
          </card-subtle>
        </template>

        <template #blockchain>
          <card-subtle>
            <div class="grid grid-cols-1 gap-3 p-4 text-sm">
              <div class="flex justify-between">
                <span class="font-medium text-gray-700 dark:text-gray-300"
                  >Starting Height</span
                >
                <span>{{ selectedPeer.startingheight || 'N/A' }}</span>
              </div>
              <USeparator></USeparator>
              <div class="flex justify-between">
                <span class="font-medium text-gray-700 dark:text-gray-300"
                  >Synced Blocks</span
                >
                <span>{{ selectedPeer.synced_blocks || 'N/A' }}</span>
              </div>
              <USeparator></USeparator>
              <div class="flex justify-between">
                <span class="font-medium text-gray-700 dark:text-gray-300"
                  >Synced Headers</span
                >
                <span>{{ selectedPeer.synced_headers || 'N/A' }}</span>
              </div>
              <USeparator></USeparator>
              <div class="flex justify-between">
                <span class="font-medium text-gray-700 dark:text-gray-300"
                  >Min Fee Filter</span
                >
                <span>{{
                  selectedPeer.minfeefilter
                    ? `${selectedPeer.minfeefilter} sat/byte`
                    : 'N/A'
                }}</span>
              </div>
            </div>
          </card-subtle>
        </template>

        <template #traffic>
          <card-subtle>
            <div class="grid grid-cols-1 gap-3 p-4 text-sm">
              <div class="flex justify-between">
                <span class="font-medium text-gray-700 dark:text-gray-300"
                  >Bytes Sent</span
                >
                <span>{{ formatBytes(selectedPeer.bytessent) }}</span>
              </div>
              <USeparator></USeparator>
              <div class="flex justify-between">
                <span class="font-medium text-gray-700 dark:text-gray-300"
                  >Bytes Received</span
                >
                <span>{{ formatBytes(selectedPeer.bytesrecv) }}</span>
              </div>
              <USeparator></USeparator>
              <div class="flex justify-between">
                <span class="font-medium text-gray-700 dark:text-gray-300"
                  >Ping Time</span
                >
                <span>{{
                  selectedPeer.pingtime
                    ? `${(selectedPeer.pingtime * 1000).toFixed(2)} ms`
                    : 'N/A'
                }}</span>
              </div>
              <USeparator></USeparator>
              <div class="flex justify-between">
                <span class="font-medium text-gray-700 dark:text-gray-300"
                  >Min Ping</span
                >
                <span>{{
                  selectedPeer.minping
                    ? `${(selectedPeer.minping * 1000).toFixed(2)} ms`
                    : 'N/A'
                }}</span>
              </div>
              <USeparator></USeparator>
              <div class="flex justify-between">
                <span class="font-medium text-gray-700 dark:text-gray-300"
                  >Connection Time</span
                >
                <span>{{ formatTimestamp(selectedPeer.conntime) }}</span>
              </div>
            </div>
          </card-subtle>
        </template>

        <template #geo>
          <card-subtle>
            <div class="grid grid-cols-1 gap-3 p-4 text-sm">
              <div class="flex justify-between">
                <span class="font-medium text-gray-700 dark:text-gray-300"
                  >City</span
                >
                <span>{{ selectedPeer.geo?.city || 'N/A' }}</span>
              </div>
              <USeparator></USeparator>
              <div class="flex justify-between">
                <span class="font-medium text-gray-700 dark:text-gray-300"
                  >Postal</span
                >
                <span>{{ selectedPeer.geo?.postal || 'N/A' }}</span>
              </div>
              <USeparator></USeparator>
              <div class="flex justify-between">
                <span class="font-medium text-gray-700 dark:text-gray-300"
                  >Country</span
                >
                <span>{{ selectedPeer.geo?.country || 'N/A' }}</span>
              </div>
              <USeparator></USeparator>
              <div class="flex justify-between">
                <span class="font-medium text-gray-700 dark:text-gray-300"
                  >Latitude</span
                >
                <span>{{ selectedPeer.geo?.latitude || 'N/A' }}</span>
              </div>
              <USeparator></USeparator>
              <div class="flex justify-between">
                <span class="font-medium text-gray-700 dark:text-gray-300"
                  >Longitude</span
                >
                <span>{{ selectedPeer.geo?.longitude || 'N/A' }}</span>
              </div>
            </div>
          </card-subtle>
        </template>
      </UTabs>

      <div class="mt-4">
        <div class="text-sm ml-2 text-slate-500 mb-1">Select Ban Length</div>
        <UFieldGroup class="w-full">
          <USelectMenu
            v-model="selectedBanLengthSeconds"
            value-key="id"
            label-key="label"
            :items="banLengthItems"
            class="w-full"
          />
          <UButton color="error" @click="banPeer" class="w-30 justify-center"
            >Ban Peer</UButton
          >
        </UFieldGroup>
      </div>
      <UModal v-model:open="showModal">
        <template #content>
          <div class="p-4">
            <h3 class="text-lg font-semibold">Confirm Ban</h3>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to ban the peer at
              {{ formatIpNoPort(selectedPeer.addr) }} for
              {{
                banLengthItems.find(
                  (item: BanLengthItem) => item?.id === selectedBanLengthSeconds
                )?.label || 'unknown duration'
              }}?
            </p>
            <div class="mt-4 flex justify-end gap-2">
              <UButton
                color="neutral"
                variant="subtle"
                @click="showModal = false"
                >Cancel</UButton
              >
              <UButton color="error" @click="confirmBan" :loading="isBanLoading"
                >Ban Peer</UButton
              >
            </div>
          </div>
        </template>
      </UModal>
    </div>
    <div v-else class="text-center py-6">
      <p class="text-gray-500 dark:text-gray-400">No peer selected</p>
    </div>
  </div>
</template>
