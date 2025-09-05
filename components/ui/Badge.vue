<script setup lang="ts">
const props = withDefaults(
  defineProps<{ variant?: 'default' | 'secondary' | 'outline' }>(),
  { variant: 'default' }
)
</script>
<template>
  <span
    :class="[
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
      props.variant === 'default' &&
        'bg-primary text-primary-foreground border-transparent',
      props.variant === 'secondary' &&
        'bg-secondary text-secondary-foreground border-transparent',
      props.variant === 'outline' && 'text-foreground',
    ]"
    ><slot
  /></span>
</template>
