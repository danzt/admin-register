<script setup lang="ts">
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'radix-vue'
const props = withDefaults(defineProps<{ defaultValue?: string }>(), {})
</script>
<template>
  <TabsRoot :default-value="props.defaultValue" class="w-full">
    <TabsList
      class="bg-muted text-muted-foreground inline-flex h-9 items-center justify-center rounded-lg p-1"
    >
      <slot name="list" :List="TabsList" :Trigger="TabsTrigger" />
    </TabsList>
    <slot name="content" :Content="TabsContent" />
  </TabsRoot>
</template>
