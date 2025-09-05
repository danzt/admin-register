<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'dashboard' })

const { data: perms } = await useFetch('/api/admin/permissions')
const {
  data: rolePerms,
  refresh,
  pending,
} = await useFetch('/api/admin/roles/permissions')

const roles = ['admin', 'staff', 'usuario']
const selected = reactive<Record<string, Set<string>>>({
  admin: new Set<string>(),
  staff: new Set<string>(),
  usuario: new Set<string>(),
})

watchEffect(() => {
  const rp = rolePerms.value?.rolePermissions || []
  roles.forEach(r => {
    const found = rp.find((x: any) => x.role === r)
    selected[r] = new Set(found?.permissions || [])
  })
})

const saving = ref(false)
const errorMsg = ref<string | null>(null)
const successMsg = ref<string | null>(null)

const toggle = (role: string, id: string) => {
  if (selected[role].has(id)) selected[role].delete(id)
  else selected[role].add(id)
}

const save = async () => {
  errorMsg.value = null
  successMsg.value = null
  saving.value = true
  const payload = roles.map(r => ({
    role: r,
    permissions: Array.from(selected[r]),
  }))
  const { error } = await useFetch('/api/admin/roles/permissions', {
    method: 'PUT',
    body: { rolePermissions: payload },
  })
  saving.value = false
  if (error.value) errorMsg.value = error.value.message
  else {
    successMsg.value = 'Guardado'
    await refresh()
  }
}
</script>

<template>
  <section class="p-6">
    <h2 class="text-xl font-semibold">Roles y permisos</h2>
    <div v-if="pending">Cargando…</div>
    <div v-else class="mt-4 grid gap-6 md:grid-cols-3">
      <div v-for="r in roles" :key="r" class="rounded border p-3">
        <h3 class="mb-2 font-medium">{{ r }}</h3>
        <ul class="space-y-1">
          <li
            v-for="p in perms?.permissions || []"
            :key="p.id"
            class="flex items-center gap-2"
          >
            <input
              type="checkbox"
              :checked="selected[r].has(p.id)"
              @change="toggle(r, p.id)"
            />
            <span>{{ p.name }}</span>
          </li>
        </ul>
      </div>
    </div>
    <div class="mt-4 flex items-center gap-3">
      <button
        @click="save"
        :disabled="saving"
        class="rounded bg-black px-4 py-2 text-white"
      >
        Guardar
      </button>
      <span v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</span>
      <span v-if="successMsg" class="text-sm text-green-600">{{
        successMsg
      }}</span>
    </div>
  </section>
</template>
