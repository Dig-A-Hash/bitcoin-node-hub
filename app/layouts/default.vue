<!-- layouts/default.vue -->
<template>
  <div>
    <!-- Header -->
    <header
      class="bg-elevated/50 border-b border-accented/50 flex justify-between items-center"
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
          class="dark:text-orange-400 light:text-amber-600 mr-1"
        ></UIcon>
        <span class="text-lg font-semibold"> Node-Runner Glass</span>
      </div>
      <ColorModeToggle />
    </header>

    <!-- Nav Drawer -->
    <UDrawer v-model:open="isOpen" direction="left" :ui="{ content: 'w-64' }">
      <template #body>
        <UNavigationMenu
          :items="navItems"
          orientation="vertical"
          class="w-full"
        />
      </template>
    </UDrawer>

    <!-- Main content -->
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

// State to control drawer
const isOpen = ref(false);

// Navigation items
const navItems = ref<NavigationMenuItem[]>([
  {
    label: 'Home',
    icon: 'i-lucide-home',
    to: '/',
  },
  {
    label: 'About',
    icon: 'i-lucide-info',
    to: '/about',
  },
  {
    label: 'Services',
    icon: 'i-lucide-briefcase',
    to: '/services',
    children: [
      {
        label: 'Consulting',
        description: 'Expert consulting services',
        to: '/services/consulting',
      },
      {
        label: 'Development',
        description: 'Custom software development',
        to: '/services/development',
      },
    ],
  },
  {
    label: 'Contact',
    icon: 'i-lucide-mail',
    to: '/contact',
  },
]);

// Toggle drawer function
const toggleDrawer = () => {
  isOpen.value = !isOpen.value;
};
</script>
