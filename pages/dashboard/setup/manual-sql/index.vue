<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'dashboard' })

const sql = ref('')
const result = ref<any>(null)
const errorMsg = ref<string | null>(null)
const running = ref(false)

const runSql = async () => {
  errorMsg.value = null
  running.value = true
  const { data, error } = await useFetch('/api/admin/sql', {
    method: 'POST',
    body: { sql: sql.value },
  })
  running.value = false
  if (error.value) errorMsg.value = error.value.message
  else result.value = data.value
}
</script>
<template>
  <section class="p-6">
    <h2 class="text-xl font-semibold">Manual SQL</h2>
    <div class="mt-4 grid gap-3">
      <textarea
        v-model="sql"
        rows="6"
        class="w-full rounded border p-2 font-mono"
        placeholder="Escribe SQL..."
      />
      <div class="flex items-center gap-3">
        <button
          @click="runSql"
          :disabled="running"
          class="rounded bg-black px-4 py-2 text-white"
        >
          {{ running ? 'Ejecutando…' : 'Ejecutar' }}
        </button>
        <span v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</span>
      </div>
      <pre v-if="result" class="bg-muted/30 rounded p-3 text-sm">{{
        result
      }}</pre>
    </div>
    <ul class="ml-6 mt-6 list-disc">
      <li>
        <NuxtLink
          class="underline"
          to="/dashboard/setup/manual-sql/add-exec-sql"
          >Add exec_sql</NuxtLink
        >
      </li>
      <li>
        <NuxtLink class="underline" to="/dashboard/setup/manual-sql/execute-rls"
          >Execute RLS</NuxtLink
        >
      </li>
    </ul>
  </section>
</template>
