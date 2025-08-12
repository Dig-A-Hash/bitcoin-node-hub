<!-- layouts/default.vue -->
<template>
  <div>
    <!-- Header -->
    <header
      class="bg-gray-800 text-white p-3 flex justify-between items-center"
    >
      <div class="flex">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-menu"
          @click="toggleDrawer"
          class="mr-2"
        />
        <span class="text-lg font-semibold">Bitcoin Node-Runner</span>
      </div>
      <div>X</div>
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
