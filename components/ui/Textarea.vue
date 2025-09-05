<script setup lang="ts">
const modelValue = defineModel<string>({ default: '' })
</script>
<template>
  <textarea
    v-model="modelValue"
    class="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
  />
</template>
