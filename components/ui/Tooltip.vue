<script setup lang="ts">
import {
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
} from 'radix-vue'
</script>
<template>
  <TooltipProvider :delay-duration="200">
    <TooltipRoot>
      <slot name="trigger" :Trigger="TooltipTrigger" />
      <TooltipPortal>
        <TooltipContent
          side="top"
          class="z-50 rounded bg-black px-2 py-1 text-xs text-white shadow"
        >
          <slot />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
