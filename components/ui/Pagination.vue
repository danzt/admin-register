<script setup lang="ts">
const props = withDefaults(defineProps<{ page: number; pageCount: number }>(), {
  page: 1,
  pageCount: 1,
})
const emit = defineEmits<{ (e: 'update:page', value: number): void }>()
const pages = computed(() => {
  const count = Math.max(1, props.pageCount)
  const current = Math.min(Math.max(1, props.page), count)
  const windowSize = 5
  let start = Math.max(1, current - Math.floor(windowSize / 2))
  let end = Math.min(count, start + windowSize - 1)
  if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})
const go = (p: number) =>
  emit('update:page', Math.min(Math.max(1, p), props.pageCount))
</script>
<template>
  <div class="flex items-center gap-2">
    <button
      class="rounded border px-2 py-1 disabled:opacity-50"
      :disabled="props.page <= 1"
      @click="go(props.page - 1)"
    >
      Anterior
    </button>
    <button
      v-for="p in pages"
      :key="p"
      @click="go(p)"
      :class="[
        'rounded border px-2 py-1',
        p === props.page ? 'bg-black text-white' : '',
      ]"
    >
      {{ p }}
    </button>
    <button
      class="rounded border px-2 py-1 disabled:opacity-50"
      :disabled="props.page >= props.pageCount"
      @click="go(props.page + 1)"
    >
      Siguiente
    </button>
  </div>
</template>
