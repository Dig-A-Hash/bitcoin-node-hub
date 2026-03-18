<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

/**
 * node.host will not exist if there is a problem
 */

const bitcoinStore = useBitcoin();
const isCollapsed = ref(false);
const bitcoinNodes = computed(() => bitcoinStore.nodeNames); // Reactively sync with nodeNames
const runtimeConfig = useRuntimeConfig();
const authEnabled = computed(() => runtimeConfig.public.authEnabled);
const { loggedIn, ready, fetch: fetchUserSession, clear: clearUserSessionState } = useUserSession();
const isFetchingSession = ref(false);

// State to control mobile menu drawer
const isMobileMenuOpen = ref(false);

const disabledStates = computed(() =>
  bitcoinNodes.value.map((node) => (!node.isError ? node.isIbd : true))
);
const canShowNavigation = computed(() => !authEnabled.value || (ready.value && loggedIn.value));

async function ensureUserSessionReady() {
  if (!authEnabled.value || ready.value || isFetchingSession.value) {
    return;
  }

  isFetchingSession.value = true;

  try {
    await fetchUserSession();
  } finally {
    isFetchingSession.value = false;
  }
}

onMounted(async () => {
  await ensureUserSessionReady();
});

async function handleLogout() {
  try {
    await $fetch<ApiResponse<{ loggedOut: boolean }>>('/api/logout', {
      method: 'POST',
    });
  } finally {
    await clearUserSessionState();
    isMobileMenuOpen.value = false;
    await navigateTo('/login');
  }
}

const navItems = computed<NavigationMenuItem[]>(() => {
  if (!canShowNavigation.value) {
    return [];
  }

  const items: NavigationMenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'material-symbols:dashboard',
      class: 'p-3 my-1',
      to: '/',
      tooltip: {
        text: 'Dashboard',
      },
      onSelect: () => {
        isMobileMenuOpen.value = false;
      },
    },
  ];

  const nodeItems: NavigationMenuItem[] = bitcoinNodes.value.map((node, index) => ({
    label: node.name || `Node ${index}`, // Assuming node has a 'name' property
    class: 'p-3 my-1',
    tooltip: {
      text: node.name,
    },
    disabled: disabledStates.value[index],
    slot: 'components' as const,
    children: node.isError
      ? undefined
      : [
        {
          label: 'System Info',
          to: `/system/${index}`,
          onSelect: () => {
            isMobileMenuOpen.value = false;
          },
        },
        {
          label: 'Mempool',
          to: `/mempool/${index}`,
          onSelect: () => {
            isMobileMenuOpen.value = false;
          },
        },
        {
          label: 'Peers',
          to: `/peers/${index}`,
          onSelect: () => {
            isMobileMenuOpen.value = false;
          },
        },
        {
          label: 'Bans',
          to: `/ban/${index}`,
          onSelect: () => {
            isMobileMenuOpen.value = false;
          },
        },
      ],
    onSelect: () => {
      isCollapsed.value = false;
      isMobileMenuOpen.value = false;
    },
  }));

  items.push(...nodeItems);

  if (bitcoinNodes.value.length) {
    items.push({
      label: 'Settings',
      icon: 'material-symbols:settings',
      class: 'p-3 my-1',
      to: '/settings',
      tooltip: {
        text: 'Settings',
      },
      onSelect: () => {
        isMobileMenuOpen.value = false; // Close the slideover
      },
    });

    items.push({
      label: 'About',
      icon: 'material-symbols:person-play-rounded',
      class: 'p-3 my-1',
      to: '/about',
      tooltip: {
        text: 'About',
      },
      onSelect: () => {
        isMobileMenuOpen.value = false; // Close the slideover
      },
    });

    if (authEnabled.value && loggedIn.value) {
      items.push({
        label: 'Logout',
        icon: 'material-symbols:logout',
        class: 'p-3 my-1',
        onSelect: () => {
          void handleLogout();
        },
        tooltip: {
          text: 'Logout',
        },
      });
    }

    items.push({
      label: 'Collapse Menu',
      icon: computed(() =>
        isCollapsed.value
          ? 'material-symbols:keyboard-double-arrow-right'
          : 'material-symbols:keyboard-double-arrow-left'
      ) as unknown as string,
      class: 'p-3 my-1 hidden lg:flex',
      tooltip: {
        text: 'Expand menu',
      },
      onSelect: () => {
        isCollapsed.value = !isCollapsed.value;
      },
    });
  }

  return items;
});

// Toggle drawer function
const toggleDrawer = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

function getNodeIconColor(index: number) {
  if (bitcoinNodes.value[index - 1]?.isError) {
    return 'dark:text-red-500 light:text-red-700';
  }

  if (bitcoinNodes.value[index - 1]?.isIbd) {
    return 'dark:text-yellow-500 light:text-amber-700';
  } else {
    return 'dark:text-green-500 light:text-green-700';
  }
}
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Sidebar for large screens -->
    <aside v-if="canShowNavigation"
      class="hidden lg:block border-r border-accented/50 dark:bg-elevated/50 light:bg-elevated/60"
      :class="`${isCollapsed ? 'w-16' : 'w-64'}`">
      <div class="flex items-center p-3 justify-center">
        <UIcon size="32" name="bitcoin-icons:bitcoin-circle-filled"
          class="dark:text-orange-400 light:text-orange-700/80 mr-1"></UIcon>
        <span class="text-lg font-semibold" v-if="!isCollapsed">Bitcoin Node Hub</span>
      </div>

      <div class="p-2 pt-0">
        <UNavigationMenu :highlight="true" :collapsed="isCollapsed" :items="navItems" orientation="vertical"
          color="secondary" class="w-full">
          <template #components-leading="{ index }">
            <UIcon size="17" name="material-symbols:network-node" :class="getNodeIconColor(index)"></UIcon>
          </template>
        </UNavigationMenu>
      </div>
    </aside>

    <!-- Main content area -->
    <div class="flex-1">
      <!-- Header -->
      <header
        class="dark:bg-elevated/50 light:bg-elevated/60 border-b border-accented/50 flex justify-between items-center">
        <div class="flex items-center">
          <UButton v-if="canShowNavigation" color="secondary" variant="ghost" @click="toggleDrawer"
            class="mr-4 rounded-none p-3 lg:hidden">
            <UIcon size="28" name="solar:hamburger-menu-linear" />
          </UButton>
          <UIcon size="32" name="bitcoin-icons:bitcoin-circle-filled"
            class="dark:text-orange-400 light:text-orange-700/80 mr-1 lg:hidden"></UIcon>
          <span class="text-lg font-semibold lg:hidden">Bitcoin Node Hub</span>
        </div>
        <ColorModeToggle />
      </header>

      <!-- Nav Drawer for smaller screens -->
      <USlideover v-if="canShowNavigation" v-model:open="isMobileMenuOpen" :ui="{ content: 'w-64', body: 'p-2 sm:p-2' }"
        side="left" title="Bitcoin Node Hub" class="lg:hidden">
        <template #body>
          <UNavigationMenu :items="navItems" orientation="vertical" color="secondary" class="w-full">
            <template #components-leading="{ index }">
              <UIcon size="17" name="material-symbols:network-node" :class="getNodeIconColor(index)"></UIcon>
            </template>
          </UNavigationMenu>
        </template>
      </USlideover>

      <!-- Main content -->
      <slot />
    </div>
  </div>
</template>
