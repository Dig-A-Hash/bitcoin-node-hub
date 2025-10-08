<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import { remove } from 'ol/array';

const banEntries = ref<BanEntry[]>();
const bitcoinStore = useBitcoin();
const { formatTimestamp, formatSecondsToDays, formatIpNoPort } =
  useTextFormatting();
const route = useRoute();
const toast = useToast();

const nodeIndex = parseInt(route.params.i?.toString() || '');
const isLoading = ref(false);
const isError = ref(false);
const isBanConfirmShowing = ref(false);
const isBanRemoveLoading = ref(false);
const selectedAddress = ref('');

const textDataSize = 'text-2xl';

const columns: TableColumn<BanEntry>[] = [
  {
    accessorKey: 'address',
    header: 'Address',
  },
  {
    accessorKey: 'ban_created',
    header: 'Created',
    cell: ({ row }) => {
      return formatTimestamp(row.original.ban_created);
    },
  },
  {
    accessorKey: 'banned_until',
    header: 'End Date',
    cell: ({ row }) => {
      return formatTimestamp(row.original.banned_until);
    },
  },
  {
    accessorKey: 'ban_duration',
    header: 'Duration',
    cell: ({ row }) => {
      return formatSecondsToDays(row.original.ban_duration);
    },
  },
  {
    accessorKey: 'time_remaining',
    header: 'Time Remaining',
    cell: ({ row }) => {
      return formatSecondsToDays(parseInt(row.original.time_remaining));
    },
  },
  {
    id: 'action',
  },
];

// Fetch data
async function fetchNodeInfo() {
  try {
    isLoading.value = true;
    const response = await $fetch<ApiResponse<BanEntry[]>>(
      `/api/ban/listBanned?nodeIndex=${nodeIndex}`,
      {
        method: 'GET',
      }
    );
    if (response.success && response.data) {
      banEntries.value = response.data;
    }
  } catch (error) {
    console.error('Error fetching:', error);
    isError.value = true;
  } finally {
    isLoading.value = false;
  }
}

function confirmRemoveBan(address: string) {
  isBanConfirmShowing.value = true;
  selectedAddress.value = address;
}

async function removeBan() {
  try {
    isBanRemoveLoading.value = true;
    const response = await $fetch<ApiResponse<BanEntry[]>>(
      `/api/ban/removeBan`,
      {
        method: 'POST',
        body: { nodeIndex, ipAddress: formatIpNoPort(selectedAddress.value) },
      }
    );

    if (response.success && response.data) {
      await fetchNodeInfo();
      isBanConfirmShowing.value = false;
      toast.add({
        title: 'Success',
        description: `The ban for ${formatIpNoPort(
          selectedAddress.value
        )} has been removed.`,
      });
    }
  } catch (error) {
    console.error('Error fetching:', error);
    isError.value = true;
    toast.add({
      color: 'error',
      title: 'Error',
      description: `The ban for ${formatIpNoPort(
        selectedAddress.value
      )} has failed.`,
    });
  } finally {
    isBanRemoveLoading.value = false;
  }
}

onMounted(async () => {
  await fetchNodeInfo();
});
</script>

<template>
  <UContainer class="mt-4">
    <h1 class="text-xl mb-4 text-white flex justify-between items-center">
      <span> Bans </span>
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
    <div v-if="banEntries && !isLoading" class="space-y-4 mb-4">
      <card-subtle class=" ">
        <div class="grid grid-cols-1 gap-2 p-2">
          <div class="p-4">
            <UTable
              ref="table"
              sticky
              :data="banEntries"
              class="flex-1"
              :columns="columns"
              :ui="{
                tr: 'data-[selected=true]:bg-elevated/100 data-[selected=true]:border-l-2 border-b-1 data-[selected=true]:border-l-green-500',
                td: 'light:text-gray-700',
              }"
            >
              <template #action-cell="{ row }">
                <UButton
                  color="error"
                  icon="material-symbols:delete-outline"
                  variant="subtle"
                  @click="confirmRemoveBan(row.original.address)"
                  >Remove</UButton
                >
              </template>
            </UTable>
          </div>
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

  <UModal v-model:open="isBanConfirmShowing">
    <template #content>
      <div class="p-4">
        <h3 class="text-lg font-semibold">Confirm Ban Removal</h3>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Are you sure you want to remove the ban for
          {{ formatIpNoPort(selectedAddress) }}?
        </p>
        <div class="mt-4 flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="subtle"
            @click="isBanConfirmShowing = false"
            >Cancel</UButton
          >
          <UButton
            color="error"
            @click="removeBan()"
            variant="subtle"
            :loading="isBanRemoveLoading"
            >Remove Ban</UButton
          >
        </div>
      </div>
    </template>
  </UModal>
</template>
