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
    :class="`${props.cardClass} dark:hover:bg-sky-300/10 dark:hover:cursor-pointer dark:hover:ring-blue-300 light:hover:bg-white light:hover:cursor-pointer light:hover:ring-blue-600`"
    :ui="{
      root: 'rounded-lg overflow-hidden  ring-1 light:ring-gray-400 dark:ring-slate-800 light:bg-gray-200',
      header: `p-0 sm:px-2 `,
      body: `p-0 sm:p-0 rounded-t-none rounded-b-lg`,
      footer: 'p-0 sm:px-0',
    }"
  >
    <template #header v-if="hasHeader">
      <slot name="header"></slot>
    </template>

    <div
      class="p-4 pt-3 dark:hover:text-blue-400 light:hover:text-blue-600 text-left"
    >
      <slot></slot>
    </div>

    <template #footer v-if="hasFooter">
      <slot name="footer"></slot>
    </template>
  </UCard>
</template>
