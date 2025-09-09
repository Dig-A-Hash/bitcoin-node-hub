<template>
  <div>
    <!-- Header -->
    <header
      class="dark:bg-elevated/50 light:bg-elevated/90 border-b border-accented/50 flex justify-between items-center"
    >
      <div class="flex items-center">
        <UButton
          color="secondary"
          variant="ghost"
          @click="toggleDrawer"
          class="mr-4 rounded-none p-3"
        >
          <UIcon size="28" name="solar:hamburger-menu-linear" />
        </UButton>
        <UIcon
          size="32"
          name="bitcoin-icons:bitcoin-circle-filled"
          class="dark:text-orange-400 light:text-orange-700/80 mr-1"
        ></UIcon>
        <span class="text-lg font-semibold"> Bitcoin Node Hub</span>
      </div>
      <ColorModeToggle />
    </header>

    <!-- Nav Drawer -->
    <USlideover
      aria-describedby="undefined"
      v-model:open="isOpen"
      :ui="{ content: 'w-64', body: 'p-2 sm:p-2' }"
      side="left"
      title="Bitcoin Node Hub"
    >
      <template #body>
        <UNavigationMenu
          :items="navItems"
          orientation="vertical"
          color="secondary"
          class="w-full"
        />
      </template>
    </USlideover>

    <!-- Main content -->
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

// State to control drawer
const isOpen = ref(false);
const router = useRouter();

// Navigation items
const navItems = ref<NavigationMenuItem[]>([
  {
    label: 'Dashboard',
    icon: 'material-symbols:dashboard',
    to: '/',
    onSelect: () => {
      isOpen.value = false; // Close the slideover
    },
  },
  {
    label: 'Settings',
    icon: 'material-symbols:settings',
    to: '/settings',
    onSelect: () => {
      isOpen.value = false; // Close the slideover
    },
  },
]);

// Toggle drawer function
const toggleDrawer = () => {
  isOpen.value = !isOpen.value;
};
</script>
