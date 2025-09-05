<script setup lang="ts">
import Table from '@/components/ui/Table.vue'
import Select from '@/components/ui/Select.vue'
import Button from '@/components/ui/Button.vue'
import { useUsers } from '@/composables/useSupabase'
import { toast } from 'vue-sonner'

const { getUsers, updateUser } = useUsers()

const loading = ref(true)
const users = ref<
  {
    id: string
    cedula: string
    nombres: string
    apellidos: string
    correo: string
    role: string
  }[]
>([])
const edited = reactive<Record<string, string>>({})

onMounted(async () => {
  try {
    users.value = await getUsers()
  } catch (e) {
    console.error(e)
    toast.error('Error cargando usuarios')
  } finally {
    loading.value = false
  }
})

const setRole = (id: string, role: string) => {
  edited[id] = role
}

const saving = ref(false)
const save = async () => {
  const payload = Object.entries(edited)
  if (!payload.length) return toast('No hay cambios')
  saving.value = true
  try {
    // Actualizar cada usuario individualmente
    for (const [id, role] of payload) {
      await updateUser(id, { role })
    }
    toast.success('Roles actualizados')
    Object.keys(edited).forEach(key => delete edited[key])
  } catch (e: any) {
    toast.error(e?.message || 'Error al actualizar roles')
  } finally {
    saving.value = false
  }
}

const editedKeys = computed(() => Object.keys(edited))
</script>
<template>
  <div class="space-y-4">
    <div v-if="loading" class="text-muted-foreground text-sm">Cargando…</div>
    <div v-else>
      <Table>
        <thead>
          <tr class="border-b text-left">
            <th class="py-2">Cédula</th>
            <th class="py-2">Nombre</th>
            <th class="py-2">Correo</th>
            <th class="py-2">Rol</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id" class="border-b">
            <td class="py-1">{{ u.cedula }}</td>
            <td class="py-1">{{ u.nombres }} {{ u.apellidos }}</td>
            <td class="py-1">{{ u.correo }}</td>
            <td class="py-1">
              <Select
                :modelValue="edited[u.id] ?? u.role"
                @update:modelValue="val => setRole(u.id, val)"
              >
                <template #default="{ Item }">
                  <Item value="admin">admin</Item>
                  <Item value="staff">staff</Item>
                  <Item value="usuario">usuario</Item>
                </template>
              </Select>
            </td>
          </tr>
        </tbody>
      </Table>
      <div class="mt-3 flex gap-2">
        <Button :disabled="!editedKeys.length || saving" @click="save"
          >Guardar cambios</Button
        >
        <span v-if="editedKeys.length" class="text-muted-foreground text-xs"
          >{{ editedKeys.length }} cambios pendientes</span
        >
      </div>
    </div>
  </div>
</template>
