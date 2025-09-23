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
    variant="subtle"
    class=""
    :ui="{
      root: ' light:ring-slate-500 dark:ring-slate-700 overflow-hidden',
      header: `p-0 px-0 sm:px-0 m-0 light:border-slate-500 dark:border-slate-700 ${headerClass}`,
      body: `p-0 sm:p-0 rounded-t-none ${
        hasFooter ? 'rounded-t-lg' : 'rounded-b-lg'
      }`,
      footer:
        'p-0 sm:px-0 border-t light:border-slate-500 dark:border-slate-700',
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
