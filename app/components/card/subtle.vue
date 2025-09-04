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
      header: `p-0 px-0 sm:px-0 m-0 ${headerClass}`,
      body: `p-0 sm:p-0  rounded-b-lg rounded-t-none ${
        hasFooter ? 'rounded-t-lg' : ''
      }`,
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
