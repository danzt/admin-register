<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'radix-vue'
const modelValue = defineModel<boolean>({ default: false })
</script>
<template>
  <SwitchRoot
    v-model:checked="modelValue"
    class="bg-input data-[state=checked]:bg-primary peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors"
  >
    <SwitchThumb
      class="bg-background pointer-events-none block h-5 w-5 translate-x-0 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5"
    />
  </SwitchRoot>
</template>
