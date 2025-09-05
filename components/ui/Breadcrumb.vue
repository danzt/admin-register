<script setup lang="ts">
const props = defineProps<{ items: { label: string; href?: string }[] }>()
</script>
<template>
  <nav class="text-muted-foreground text-sm" aria-label="Breadcrumb">
    <ol class="flex items-center gap-2">
      <li
        v-for="(it, idx) in props.items"
        :key="idx"
        class="flex items-center gap-2"
      >
        <NuxtLink v-if="it.href" :to="it.href" class="hover:underline">{{
          it.label
        }}</NuxtLink>
        <span v-else class="text-foreground">{{ it.label }}</span>
        <span v-if="idx < props.items.length - 1" class="opacity-60">/</span>
      </li>
    </ol>
  </nav>
</template>
