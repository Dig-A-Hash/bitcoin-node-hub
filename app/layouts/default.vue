<template>
  <div class="flex min-h-screen">
    <!-- Sidebar for large screens -->
    <aside
      class="hidden lg:block w-64 border-r border-accented/50 dark:bg-elevated/50 light:bg-elevated/60"
    >
      <div class="flex items-center p-3 justify-center">
        <UIcon
          size="32"
          name="bitcoin-icons:bitcoin-circle-filled"
          class="dark:text-orange-400 light:text-orange-700/80 mr-1"
        ></UIcon>
        <span class="text-lg font-semibold">Bitcoin Node Hub</span>
      </div>
      <div class="p-2 pt-0">
        <UNavigationMenu
          :items="navItems"
          orientation="vertical"
          color="secondary"
          class="w-full"
        />
      </div>
    </aside>

    <!-- Main content area -->
    <div class="flex-1">
      <!-- Header -->
      <header
        class="dark:bg-elevated/50 light:bg-elevated/60 border-b border-accented/50 flex justify-between items-center"
      >
        <div class="flex items-center">
          <UButton
            color="secondary"
            variant="ghost"
            @click="toggleDrawer"
            class="mr-4 rounded-none p-3 lg:hidden"
          >
            <UIcon size="28" name="solar:hamburger-menu-linear" />
          </UButton>
          <UIcon
            size="32"
            name="bitcoin-icons:bitcoin-circle-filled"
            class="dark:text-orange-400 light:text-orange-700/80 mr-1 lg:hidden"
          ></UIcon>
          <span class="text-lg font-semibold lg:hidden">Bitcoin Node Hub</span>
        </div>
        <ColorModeToggle />
      </header>

      <!-- Nav Drawer for smaller screens -->
      <USlideover
        v-model:open="isOpen"
        :ui="{ content: 'w-64', body: 'p-2 sm:p-2' }"
        side="left"
        title="Bitcoin Node Hub"
        class="lg:hidden"
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
    class: 'p-3 my-1',
    to: '/',
    onSelect: () => {
      isOpen.value = false; // Close the slideover
    },
  },
  {
    label: 'Search',
    icon: 'material-symbols:search',
    class: 'p-3 my-1',
    to: '/search',
    onSelect: () => {
      isOpen.value = false; // Close the slideover
    },
  },
  {
    label: 'Settings',
    icon: 'material-symbols:settings',
    class: 'p-3 my-1',
    to: '/settings',
    onSelect: () => {
      isOpen.value = false; // Close the slideover
    },
  },
  {
    label: 'About',
    icon: 'material-symbols:person-play-rounded',
    class: 'p-3 my-1',
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
