<script lang="ts" setup>
const bitcoinStore = useBitcoin();
const runtimeConfig = useRuntimeConfig();
const authEnabled = computed(() => runtimeConfig.public.authEnabled);
const { loggedIn, ready, fetch } = useUserSession();
const hasFetchedNodeNames = ref(false);
const isCheckingSession = ref(false);

async function ensureUserSessionReady() {
  if (!authEnabled.value || ready.value || isCheckingSession.value) {
    return;
  }

  isCheckingSession.value = true;

  try {
    await fetch();
  } finally {
    isCheckingSession.value = false;
  }
}

async function fetchNodeNamesOnce() {
  if (hasFetchedNodeNames.value) {
    return;
  }

  hasFetchedNodeNames.value = true;
  await bitcoinStore.fetchNodeNames();
}

watch(
  [authEnabled, ready, loggedIn],
  async ([isAuthEnabled, isReady, isLoggedIn]) => {
    if (!isAuthEnabled) {
      await fetchNodeNamesOnce();
      return;
    }

    if (!isReady) {
      await ensureUserSessionReady();
      return;
    }

    if (isLoggedIn) {
      await fetchNodeNamesOnce();
    }
  },
  { immediate: true }
);
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
