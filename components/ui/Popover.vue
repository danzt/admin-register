<script setup lang="ts">
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
} from 'radix-vue'
</script>
<template>
  <PopoverRoot>
    <slot name="trigger" :Trigger="PopoverTrigger" />
    <PopoverPortal>
      <PopoverContent
        class="bg-popover text-popover-foreground z-50 rounded-md border p-3 shadow-md"
      >
        <slot />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
