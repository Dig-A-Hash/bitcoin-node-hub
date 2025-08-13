<template>
  <UButton
    variant="ghost"
    color="secondary"
    class="rounded-none p-3"
    @click="toggleColorMode"
  >
    <UIcon
      size="28"
      v-if="mode === 'light'"
      name="solar:moon-stars-bold"
    ></UIcon>
    <UIcon
      size="28"
      class="dark:text-blue-400"
      v-else
      name="solar:sun-2-bold-duotone"
    ></UIcon>
  </UButton>
</template>

<script setup>
import { UButton } from '#components';
import { useCustomColorMode } from '~/composables/useCustomColorMode';

const { mode, toggleColorMode } = useCustomColorMode();
</script>

<style scoped>
button {
  transition: background-color 0.3s ease;
}
</style>
