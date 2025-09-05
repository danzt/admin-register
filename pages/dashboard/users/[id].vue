<script setup lang="ts">
import { useUsers } from '@/composables/useSupabase'
import type { UserFormInput } from '@/lib/validation/users'
import {
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogRoot,
    AlertDialogTitle,
    AlertDialogTrigger,
} from 'radix-vue'
import { toast } from 'vue-sonner'

const route = useRoute()
const router = useRouter()
definePageMeta({ middleware: 'auth', layout: 'dashboard' })

const { getUserById, updateUser, deleteUser } = useUsers()

const user = ref<any>(null)
const pending = ref(true)
const error = ref<string | null>(null)
const submitting = ref(false)
const saveError = ref<string | null>(null)
const delError = ref<string | null>(null)

const initial = computed<Partial<UserFormInput>>(() => ({
  idNumber: user.value?.idNumber || '',
  firstNames: user.value?.firstNames || '',
  lastNames: user.value?.lastNames || '',
  phone: user.value?.phone || '',
  address: user.value?.address || '',
  email: user.value?.email || '',
  baptismDate: user.value?.baptismDate?.slice?.(0, 10) || '',
  whatsapp: !!user.value?.whatsapp,
  baptized: !!user.value?.baptized,
}))

const loadUser = async () => {
  try {
    pending.value = true
    error.value = null
    user.value = await getUserById(route.params.id as string)
  } catch (e: any) {
    error.value = e.message
    toast.error('Error al cargar usuario')
  } finally {
    pending.value = false
  }
}

const onSubmit = async (values: UserFormInput) => {
  saveError.value = null
  submitting.value = true

  try {
    await updateUser(route.params.id as string, values)
    toast.success('Usuario actualizado')
    await loadUser()
  } catch (error: any) {
    saveError.value = error.message
    toast.error(error.message)
  } finally {
    submitting.value = false
  }
}

const onDelete = async () => {
  delError.value = null

  try {
    await deleteUser(route.params.id as string)
    toast.success('Usuario eliminado')
    router.push('/dashboard/users')
  } catch (error: any) {
    delError.value = error.message
    toast.error(error.message)
  }
}

onMounted(() => {
  loadUser()
})
</script>
<template>
  <section class="space-y-4 p-6">
    <Breadcrumb
      :items="[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Usuarios', href: '/dashboard/users' },
        { label: user ? `${user?.firstNames} ${user?.lastNames}` : 'Usuario' },
      ]"
    />
    <div class="flex items-center justify-between">
      <Button
        variant="outline"
        @click="() => router.push('/dashboard/users')"
        >Volver</Button
      >
      <AlertDialogRoot>
        <AlertDialogTrigger as-child>
          <button class="text-red-600 underline">Eliminar</button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. ¿Seguro que deseas eliminar este
            usuario?
          </AlertDialogDescription>
          <div class="mt-4 flex justify-end gap-3">
            <AlertDialogCancel class="rounded border px-3 py-1"
              >Cancelar</AlertDialogCancel
            >
            <AlertDialogAction
              @click="onDelete"
              class="rounded bg-red-600 px-3 py-1 text-white"
              >Eliminar</AlertDialogAction
            >
          </div>
          <p v-if="delError" class="mt-2 text-sm text-red-600">
            {{ delError }}
          </p>
        </AlertDialogContent>
      </AlertDialogRoot>
    </div>
    <div v-if="pending">Cargando…</div>
    <p v-else-if="error" class="text-red-600">Error: {{ error }}</p>
    <div v-else class="grid gap-6">
      <Card class="p-4">
        <h3 class="mb-2 font-medium">Editar</h3>
        <UserForm
          :initial="initial"
          :submitting="submitting"
          @submit="onSubmit"
        />
        <p v-if="saveError" class="mt-2 text-sm text-red-600">
          {{ saveError }}
        </p>
      </Card>
      <Card class="p-4">
        <h3 class="mb-2 font-medium">Detalle</h3>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div class="text-muted-foreground text-sm">Cédula</div>
            <div class="font-medium">{{ user?.idNumber }}</div>
          </div>
          <div>
            <div class="text-muted-foreground text-sm">Correo</div>
            <div class="font-medium">{{ user?.email }}</div>
          </div>
          <div>
            <div class="text-muted-foreground text-sm">Teléfono</div>
            <div class="font-medium">{{ user?.phone }}</div>
          </div>
          <div>
            <div class="text-muted-foreground text-sm">Dirección</div>
            <div class="font-medium">{{ user?.address }}</div>
          </div>
          <div>
            <div class="text-muted-foreground text-sm">Rol</div>
            <div class="font-medium">{{ user?.role }}</div>
          </div>
        </div>
      </Card>
    </div>
  </section>
</template>
