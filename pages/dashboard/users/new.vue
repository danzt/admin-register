<script setup lang="ts">
import Breadcrumb from '@/components/ui/Breadcrumb.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import { useUsers } from '@/composables/useSupabase'
import type { UserFormInput } from '@/lib/validation/users'
import { toast } from 'vue-sonner'

definePageMeta({ middleware: 'auth', layout: 'dashboard' })

const { createUser } = useUsers()
const submitting = ref(false)
const errorMsg = ref<string | null>(null)
const router = useRouter()

const onSubmit = async (values: UserFormInput) => {
  errorMsg.value = null
  submitting.value = true

  try {
    const userData = {
      ...values,
      idNumber: values.idNumber.trim(),
      email: values.email?.trim().toLowerCase() || null,
      password_hash: 'temp_password',
      role: 'usuario' as const,
    }

    const newUser = await createUser(userData)
    toast.success('Usuario creado correctamente')
    router.push('/dashboard/users')
  } catch (error: any) {
    errorMsg.value = error.message
    toast.error(error.message)
  } finally {
    submitting.value = false
  }
}
</script>
<template>
  <section class="space-y-4 p-6">
    <Breadcrumb
      :items="[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Usuarios', href: '/dashboard/users' },
        { label: 'Nuevo Usuario' },
      ]"
    />
    <div>
      <Button
        variant="outline"
        @click="() => router.push('/dashboard/users')"
        >Volver</Button
      >
    </div>
    <Card class="p-4">
      <h2 class="mb-4 text-xl font-semibold">Nuevo usuario</h2>
      <UserForm :submitting="submitting" @submit="onSubmit" />
      <p v-if="errorMsg" class="mt-3 text-sm text-red-600">{{ errorMsg }}</p>
    </Card>
  </section>
</template>
