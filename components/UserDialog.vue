<script setup lang="ts">
import Button from '@/components/ui/Button.vue'
import Checkbox from '@/components/ui/Checkbox.vue'
import Dialog from '@/components/ui/Dialog.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import { toast } from 'vue-sonner'

interface UserData {
  id?: string
  idNumber: string
  firstNames: string
  lastNames: string
  phone: string | null
  address: string | null
  email: string | null
  baptismDate: string | null
  whatsapp: boolean
  created_at?: string
}

interface UserDialogProps {
  isOpen: boolean
  user: UserData | null
}

const props = defineProps<UserDialogProps>()
const emit = defineEmits<{ close: []; save: [] }>()

const isEditing = computed(() => !!props.user)
const isLoading = ref(false)
const formData = reactive({
  idNumber: '',
  firstNames: '',
  lastNames: '',
  phone: '',
  address: '',
  email: '',
  baptismDate: '',
  whatsapp: false,
})
const errors = reactive<Record<string, string>>({})

// Inicializar formulario cuando cambie el usuario
watch(
  () => props.user,
  newUser => {
    if (newUser) {
      Object.assign(formData, {
        idNumber: newUser.idNumber || '',
        firstNames: newUser.firstNames || '',
        lastNames: newUser.lastNames || '',
        phone: newUser.phone || '',
        address: newUser.address || '',
        email: newUser.email || '',
        baptismDate: newUser.baptismDate
          ? new Date(newUser.baptismDate).toISOString().split('T')[0]
          : '',
        whatsapp: newUser.whatsapp || false,
      })
    } else {
      // Reset form
      Object.assign(formData, {
        idNumber: '',
        firstNames: '',
        lastNames: '',
        phone: '',
        address: '',
        email: '',
        baptismDate: '',
        whatsapp: false,
      })
    }
    // Limpiar errores
    Object.keys(errors).forEach(key => delete errors[key])
  },
  { immediate: true }
)

const handleChange = (field: keyof typeof formData, value: any) => {
  formData[field] = value
  if (errors[field]) {
    delete errors[field]
  }
}

const validateForm = () => {
  const newErrors: Record<string, string> = {}

  if (!formData.idNumber.trim()) {
    newErrors.idNumber = 'La cédula es obligatoria'
  } else if (!/^\d+$/.test(formData.idNumber)) {
    newErrors.idNumber = 'La cédula debe contener solo números'
  }

  if (!formData.firstNames.trim()) {
    newErrors.firstNames = 'El nombre es obligatorio'
  }

  if (!formData.lastNames.trim()) {
    newErrors.lastNames = 'El apellido es obligatorio'
  }

  if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
    newErrors.email = 'El correo electrónico no es válido'
  }

  Object.keys(newErrors).forEach(key => {
    errors[key] = newErrors[key]
  })

  return Object.keys(newErrors).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  isLoading.value = true

  try {
    const endpoint = isEditing.value
      ? `/api/admin/users/${props.user?.id}`
      : '/api/admin/users'

    const method = isEditing.value ? 'PUT' : 'POST'

    const response = await $fetch(endpoint, {
      method,
      body: {
        ...formData,
        baptismDate: formData.baptismDate || null,
        phone: formData.phone || null,
        address: formData.address || null,
        email: formData.email || null,
      },
    })

    toast.success(isEditing.value ? 'Usuario actualizado' : 'Usuario creado')
    emit('save')
    emit('close')
  } catch (error: any) {
    console.error('Error al guardar usuario:', error)
    errors.form = error?.data?.error || 'Ocurrió un error al guardar el usuario'
    toast.error(errors.form)
  } finally {
    isLoading.value = false
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <Dialog :open="isOpen" @close="handleClose">
    <div class="sm:max-w-md">
      <div class="mb-4">
        <h2 class="text-lg font-semibold">
          {{ isEditing ? 'Editar Usuario' : 'Nuevo Usuario' }}
        </h2>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid gap-4">
          <div class="grid gap-2">
            <Label for="idNumber">Cédula *</Label>
            <Input
              id="idNumber"
              v-model="formData.idNumber"
              @input="handleChange('idNumber', $event.target.value)"
              :disabled="isLoading"
            />
            <span v-if="errors.idNumber" class="text-sm text-red-500">
              {{ errors.idNumber }}
            </span>
          </div>

          <div class="grid gap-2 md:grid-cols-2">
            <div>
              <Label for="firstNames">Nombres *</Label>
              <Input
                id="firstNames"
                v-model="formData.firstNames"
                @input="handleChange('firstNames', $event.target.value)"
                :disabled="isLoading"
              />
              <span v-if="errors.firstNames" class="text-sm text-red-500">
                {{ errors.firstNames }}
              </span>
            </div>
            <div>
              <Label for="lastNames">Apellidos *</Label>
              <Input
                id="lastNames"
                v-model="formData.lastNames"
                @input="handleChange('lastNames', $event.target.value)"
                :disabled="isLoading"
              />
              <span v-if="errors.lastNames" class="text-sm text-red-500">
                {{ errors.lastNames }}
              </span>
            </div>
          </div>

          <div class="grid gap-2 md:grid-cols-2">
            <div>
              <Label for="email">Correo</Label>
              <Input
                id="email"
                v-model="formData.email"
                @input="handleChange('email', $event.target.value)"
                type="email"
                :disabled="isLoading"
              />
              <span v-if="errors.email" class="text-sm text-red-500">
                {{ errors.email }}
              </span>
            </div>
            <div>
              <Label for="phone">Teléfono</Label>
              <Input
                id="phone"
                v-model="formData.phone"
                @input="handleChange('phone', $event.target.value)"
                :disabled="isLoading"
              />
            </div>
          </div>

          <div class="grid gap-2">
            <Label for="address">Dirección</Label>
            <Input
              id="address"
              v-model="formData.address"
              @input="handleChange('address', $event.target.value)"
              :disabled="isLoading"
            />
          </div>

          <div class="grid gap-2">
            <Label for="baptismDate">Fecha Bautizo</Label>
            <Input
              id="baptismDate"
              v-model="formData.baptismDate"
              @input="handleChange('baptismDate', $event.target.value)"
              type="date"
              :disabled="isLoading"
            />
          </div>

          <div class="flex items-center gap-2">
            <Checkbox
              id="whatsapp"
              v-model="formData.whatsapp"
              @update:checked="handleChange('whatsapp', $event)"
              :disabled="isLoading"
            />
            <Label for="whatsapp" class="text-sm font-normal">
              Tiene WhatsApp
            </Label>
          </div>

          <div v-if="errors.form" class="text-center text-sm text-red-500">
            {{ errors.form }}
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            @click="handleClose"
            :disabled="isLoading"
          >
            Cancelar
          </Button>
          <Button type="submit" :disabled="isLoading">
            <span v-if="isLoading" class="flex items-center gap-2">
              <div
                class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
              ></div>
              Guardando...
            </span>
            <span v-else>Guardar</span>
          </Button>
        </div>
      </form>
    </div>
  </Dialog>
</template>
