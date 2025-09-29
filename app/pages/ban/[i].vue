<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';

const banEntries = ref<BanEntry[]>();
const bitcoinStore = useBitcoin();
const { formatTimestamp, formatSecondsToDays } = useTextFormatting();
const route = useRoute();
const nodeIndex = parseInt(route.params.i?.toString() || '');
const isLoading = ref(false);
const isError = ref(false);

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
            />
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
</template>
