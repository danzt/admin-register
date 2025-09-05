<script setup lang="ts">
import { CheckboxRoot, CheckboxIndicator } from 'radix-vue'

const modelValue = defineModel<boolean>({ default: false })
</script>
<template>
  <CheckboxRoot
    v-model:checked="modelValue"
    class="border-primary focus-visible:ring-ring data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground peer h-4 w-4 shrink-0 rounded-sm border shadow focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
  >
    <CheckboxIndicator class="flex items-center justify-center text-white">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="h-3.5 w-3.5"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
