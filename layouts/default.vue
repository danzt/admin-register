<script setup lang="ts">
import { Toaster } from 'vue-sonner'
</script>
<template>
  <div>
    <slot />
    <ClientOnly>
      <Toaster position="top-right" richColors closeButton />
    </ClientOnly>
  </div>
</template>
