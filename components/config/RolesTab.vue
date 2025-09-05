<script setup lang="ts">
import Checkbox from '@/components/ui/Checkbox.vue'
import Button from '@/components/ui/Button.vue'
import { usePermissions } from '@/composables/useSupabase'
import { toast } from 'vue-sonner'

const roles = ['admin', 'staff', 'usuario'] as const
const { getPermissions, getRolePermissions, updateRolePermissions } =
  usePermissions()

const permissions = ref<{ id: string; name: string }[]>([])
const selected = reactive<Record<string, Set<string>>>({
  admin: new Set(),
  staff: new Set(),
  usuario: new Set(),
})
const loading = ref(true)

onMounted(async () => {
  try {
    const [perms, rp] = await Promise.all([
      getPermissions(),
      getRolePermissions(),
    ])
    permissions.value = perms
    rp.forEach(rolePerm => {
      selected[rolePerm.role] = new Set(rolePerm.permissions)
    })
  } catch (e) {
    console.error(e)
    toast.error('Error cargando permisos')
  } finally {
    loading.value = false
  }
})

const toggle = (role: string, id: string) => {
  if (selected[role].has(id)) selected[role].delete(id)
  else selected[role].add(id)
}

const saving = ref(false)
const save = async () => {
  saving.value = true
  try {
    const payload = roles.map(r => ({
      role: r,
      permissions: Array.from(selected[r]),
    }))
    await updateRolePermissions(payload)
    toast.success('Permisos guardados')
  } catch (e: any) {
    toast.error(e?.message || 'Error al guardar')
  } finally {
    saving.value = false
  }
}
</script>
<template>
  <div class="space-y-4">
    <div v-if="loading" class="text-muted-foreground text-sm">Cargando…</div>
    <div v-else class="grid gap-4 md:grid-cols-3">
      <div v-for="r in roles" :key="r" class="rounded border p-3">
        <div class="mb-2 font-medium">{{ r }}</div>
        <div class="space-y-2">
          <label
            v-for="p in permissions"
            :key="p.id"
            class="flex items-center gap-2 text-sm"
          >
            <Checkbox
              v-model="selected[r] as any"
              :checked="selected[r].has(p.id)"
              @update:checked="() => toggle(r, p.id)"
            />
            <span>{{ p.name }}</span>
          </label>
        </div>
      </div>
    </div>
    <div class="flex gap-2">
      <Button :disabled="saving" @click="save">Guardar</Button>
    </div>
  </div>
</template>
