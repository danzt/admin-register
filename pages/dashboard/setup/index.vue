<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'dashboard' })
</script>
<template>
  <section class="p-6">
    <h2 class="text-xl font-semibold">Setup</h2>
    <ul class="ml-6 mt-2 list-disc">
      <li>
        <NuxtLink class="underline" to="/dashboard/setup/manual-sql"
          >Manual SQL</NuxtLink
        >
      </li>
      <li>
        <NuxtLink class="underline" to="/dashboard/setup/rls">RLS</NuxtLink>
      </li>
    </ul>
  </section>
</template>
