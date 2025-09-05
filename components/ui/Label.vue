<script setup lang="ts">
const props = withDefaults(defineProps<{ forId?: string }>(), {})
</script>
<template>
  <label
    :for="props.forId"
    class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
  >
    <slot />
  </label>
</template>
