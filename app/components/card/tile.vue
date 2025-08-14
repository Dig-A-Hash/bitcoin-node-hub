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
      root: 'rounded-lg overflow-hidden',
      header: `p-0 sm:px-2 ${headerClass}`,
      body: `p-0 sm:p-0  rounded-b-lg rounded-t-none ${
        hasFooter ? 'rounded-t-lg' : ''
      }`,
      footer: 'p-0 sm:px-0',
    }"
  >
    <slot></slot>
  </UCard>
</template>
