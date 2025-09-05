<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'dashboard' })

const { checkRole, user } = useAuth()
const userRole = ref<string | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    loading.value = true
    userRole.value = await checkRole()
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="p-6">
    <h2 class="text-xl font-semibold">Check Role</h2>
    <div v-if="loading" class="mt-2 text-sm">Cargando...</div>
    <div v-else-if="error" class="mt-2 text-sm text-red-600">
      Error: {{ error }}
    </div>
    <div v-else class="bg-muted/30 mt-2 rounded p-3 text-sm">
      <p><strong>Usuario:</strong> {{ user?.email }}</p>
      <p><strong>Rol:</strong> {{ userRole || 'No asignado' }}</p>
    </div>
  </section>
</template>
