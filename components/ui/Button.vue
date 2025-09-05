<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?:
      | 'default'
      | 'secondary'
      | 'destructive'
      | 'outline'
      | 'ghost'
      | 'link'
    size?: 'sm' | 'md' | 'lg'
    as?: 'button' | 'a'
  }>(),
  {
    variant: 'default',
    size: 'md',
    as: 'button',
  }
)

const base =
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
const sizes: Record<string, string> = {
  sm: 'h-8 px-3 py-1',
  md: 'h-9 px-4 py-2',
  lg: 'h-10 px-6 py-2',
}
const variants: Record<string, string> = {
  default: 'bg-black text-white hover:bg-black/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  destructive: 'bg-red-600 text-white hover:bg-red-600/90',
  outline:
    'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
}
</script>

<template>
  <component
    :is="props.as"
    :class="[base, sizes[props.size], variants[props.variant]]"
  >
    <slot />
  </component>
</template>
