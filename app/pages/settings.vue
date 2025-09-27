<script setup lang="ts">
const appSettings = useAppSettings();

// Computed property to convert POLL_INTERVAL between milliseconds and seconds
const dashPollInterval = computed({
  get: () => appSettings.dashboard.POLL_INTERVAL / 1000,
  set: (value: number) => {
    appSettings.dashboard.POLL_INTERVAL = value * 1000;
  },
});

const dashPollIntervalIbd = computed({
  get: () => appSettings.dashboard.POLL_INTERVAL_IBD / 1000,
  set: (value: number) => {
    appSettings.dashboard.POLL_INTERVAL_IBD = value * 1000;
  },
});

const mempoolPollInterval = computed({
  get: () => appSettings.mempool.POLL_INTERVAL / 1000,
  set: (value: number) => {
    appSettings.mempool.POLL_INTERVAL = value * 1000;
  },
});

function resetPolling() {
  appSettings.mempool.POLL_INTERVAL = 30000;
  appSettings.dashboard.POLL_INTERVAL = 30000;
  appSettings.dashboard.POLL_INTERVAL_IBD = 600000;
}
</script>

<template>
  <UContainer>
    <h1 class="my-4 text-xl">Settings</h1>
    <div class="grid grid-cols-1 sm:grid-cols-2">
      <card-subtle>
        <template #header>
          <div class="text-lg p-2">Polling Intervals</div>
        </template>
        <div class="p-4">
          <UFormField
            class="mb-6"
            label="Dashboard"
            help="Polling interval for the dashboard."
          >
            <UInputNumber
              size="xl"
              :min="5"
              :max="9999"
              v-model="dashPollInterval"
              class="mr-1 w-40"
            />
            Sec.
          </UFormField>

          <UFormField
            class="mb-6"
            label="Dashboard IBD"
            help="Polling interval for the dashboard when the node is conducting the Initial Block Download (IBD)."
          >
            <UInputNumber
              size="xl"
              :min="60"
              :max="9999"
              v-model="dashPollIntervalIbd"
              class="mr-1 w-40"
            />
            Sec.
          </UFormField>

          <UFormField
            class=""
            label="Mempool Visualizer"
            help="Polling interval for the mempool visualizer."
          >
            <UInputNumber
              size="xl"
              :min="5"
              :max="9999"
              v-model="mempoolPollInterval"
              class="mr-1 w-40"
            />
            Sec.
          </UFormField>
        </div>
        <template #footer>
          <div class="p-2 text-right">
            <UButton color="error" @click="resetPolling()" variant="subtle"
              >Reset to Defaults</UButton
            >
          </div>
        </template>
      </card-subtle>
    </div>
  </UContainer>
</template>
