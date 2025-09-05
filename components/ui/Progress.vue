<script setup lang="ts">
const props = withDefaults(defineProps<{ value: number }>(), { value: 0 })
</script>
<template>
  <div class="bg-muted h-2 w-full overflow-hidden rounded">
    <div
      class="bg-primary h-full transition-all"
      :style="{ width: Math.min(100, Math.max(0, props.value)) + '%' }"
    />
  </div>
</template>
