<script setup lang="ts">
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Button from '@/components/ui/Button.vue'

const { login, user } = useAuth()
const loading = ref(false)
const errorMsg = ref<string | null>(null)
const email = ref('')
const password = ref('')
const router = useRouter()

watchEffect(() => {
  if (user.value) router.replace('/dashboard')
})

const onSubmit = async () => {
  errorMsg.value = null
  loading.value = true

  try {
    await login(email.value, password.value)
    router.replace('/dashboard')
  } catch (error: any) {
    errorMsg.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-6">
    <form @submit.prevent="onSubmit" class="w-full max-w-sm space-y-4">
      <h1 class="text-xl font-semibold">Iniciar sesión</h1>
      <div>
        <Label>Email</Label>
        <Input v-model="email" type="email" placeholder="tu@correo.com" />
      </div>
      <div>
        <Label>Password</Label>
        <Input v-model="password" type="password" placeholder="********" />
      </div>
      <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>
      <Button :disabled="loading" class="w-full">
        {{ loading ? 'Ingresando…' : 'Ingresar' }}
      </Button>
      <p class="text-sm">
        ¿No tienes cuenta?
        <NuxtLink class="underline" to="/auth/register">Regístrate</NuxtLink>
      </p>
    </form>
  </div>
</template>
