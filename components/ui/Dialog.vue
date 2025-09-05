<script setup lang="ts">
import {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent as RContent,
  DialogTitle as RTitle,
  DialogDescription as RDescription,
  DialogClose,
} from 'radix-vue'

withDefaults(defineProps<{ open?: boolean }>(), {})
</script>
<template>
  <DialogRoot>
    <slot name="trigger" :Trigger="DialogTrigger">
      <DialogTrigger>
        <slot name="button">Open</slot>
      </DialogTrigger>
    </slot>
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 bg-black/50" />
      <RContent
        class="bg-background fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border p-6 shadow-lg"
      >
        <slot name="title" :Title="RTitle">
          <RTitle class="text-lg font-semibold" />
        </slot>
        <slot name="description" :Description="RDescription">
          <RDescription class="text-muted-foreground text-sm" />
        </slot>
        <div class="mt-4">
          <slot />
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <DialogClose class="rounded border px-3 py-1">Cerrar</DialogClose>
        </div>
      </RContent>
    </DialogPortal>
  </DialogRoot>
</template>
