<script lang="ts" setup>
const bitcoinStore = useBitcoin();
onMounted(async () => {
  await bitcoinStore.fetchNodeNames();
});
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
