<script setup lang="ts">
import {
  SelectRoot,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectPortal,
} from 'radix-vue'

const modelValue = defineModel<string | number | null>({ default: null })
</script>
<template>
  <SelectRoot v-model="modelValue">
    <SelectTrigger
      class="flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm"
    >
      <SelectValue class="truncate" placeholder="Selecciona…" />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent
        class="bg-popover text-popover-foreground z-50 min-w-[12rem] rounded-md border p-1 shadow-md"
      >
        <slot :Item="SelectItem" />
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
