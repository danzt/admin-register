<script setup lang="ts">
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from 'radix-vue'

// Export subcomponents via slots
</script>
<template>
  <ClientOnly>
    <DropdownMenuRoot>
      <slot name="trigger" :Trigger="DropdownMenuTrigger">
        <DropdownMenuTrigger>
          <slot name="button">Open</slot>
        </DropdownMenuTrigger>
      </slot>
      <DropdownMenuPortal>
        <DropdownMenuContent
          class="bg-popover text-popover-foreground z-50 min-w-[12rem] rounded-md border p-1 shadow-md"
        >
          <slot
            :Item="DropdownMenuItem"
            :Label="DropdownMenuLabel"
            :Separator="DropdownMenuSeparator"
          />
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  </ClientOnly>
</template>
