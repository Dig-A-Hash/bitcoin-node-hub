<script setup lang="ts">
const props = defineProps<{
  cardClass?: string;
  headerClass?: string;
}>();

const slots = defineSlots<{
  header: () => any;
  default(): any;
  footer: () => any;
}>();

const hasFooter = computed(() => !!slots.footer);
const hasHeader = computed(() => !!slots.header);
</script>
<template>
  <UCard
    :class="`${props.cardClass} dark:bg-blue-700/10 dark:ring-blue-500/50 dark:hover:bg-blue-400/10 dark:hover:cursor-pointer dark:hover:ring-blue-300 light:bg-gray-300 light:ring-gray-600/50 light:hover:bg-blue-200 light:hover:cursor-pointer light:hover:ring-blue-500`"
    :ui="{
      root: 'rounded-lg overflow-hidden  ring-1 light:ring-gray-400 dark:ring-slate-800 light:bg-gray-100',
      header: `p-0 sm:px-2 `,
      body: `p-0 sm:p-0 rounded-t-none rounded-b-lg`,
      footer: 'p-0 sm:px-0',
    }"
  >
    <template #header v-if="hasHeader">
      <slot name="header"></slot>
    </template>

    <div
      class="p-4 pt-3 dark:text-blue-400 dark:hover:text-blue-200 light:hover:text-blue-700 text-left"
    >
      <slot></slot>
    </div>

    <template #footer v-if="hasFooter">
      <slot name="footer"></slot>
    </template>
  </UCard>
</template>
