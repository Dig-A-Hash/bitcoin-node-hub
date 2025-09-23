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
    :class="props.cardClass"
    :ui="{
      root: 'rounded-lg overflow-hidden ring-1 light:ring-gray-400 dark:ring-slate-700 light:bg-gray-100',
      header: `p-0 sm:px-2 ${headerClass}`,
      body: `p-0 sm:p-0 rounded-t-none ${
        hasFooter ? 'rounded-t-lg' : 'rounded-b-lg'
      }`,
      footer: 'p-0 sm:px-0',
    }"
  >
    <template #header v-if="hasHeader">
      <slot name="header"></slot>
    </template>

    <slot></slot>

    <template #footer v-if="hasFooter">
      <slot name="footer"></slot>
    </template>
  </UCard>
</template>
