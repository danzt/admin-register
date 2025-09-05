<script setup lang="ts">
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Switch from '@/components/ui/Switch.vue'
import { userFormSchema, type UserFormInput } from '@/lib/validation/users'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'

const props = defineProps<{
  initial?: Partial<UserFormInput>
  submitting?: boolean
}>()
const emit = defineEmits<{ (e: 'submit', values: UserFormInput): void }>()

const form = useForm<UserFormInput>({
  validationSchema: toTypedSchema(userFormSchema),
  initialValues: {
    cedula: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    direccion: '',
    correo: '',
    fecha_bautizo: '',
    whatsapp: false,
    bautizado: false,
    ...(props.initial || {}),
  },
})

const { defineField, errors, handleSubmit } = form

const [idNumber, idNumberAttrs] = defineField('cedula')
const [firstNames, firstNamesAttrs] = defineField('nombres')
const [lastNames, lastNamesAttrs] = defineField('apellidos')
const [phone, phoneAttrs] = defineField('telefono')
const [address, addressAttrs] = defineField('direccion')
const [email, emailAttrs] = defineField('correo')
const [baptismDate, baptismDateAttrs] = defineField('fecha_bautizo')
const [whatsapp, whatsappAttrs] = defineField('whatsapp')
const [baptized, baptizedAttrs] = defineField('bautizado')

const onSubmit = handleSubmit(values => emit('submit', values))

watch(baptismDate, val => {
  if (typeof val === 'string' && val.trim().length > 0) baptized.value = true
})
watch(baptized, val => {
  if (!val) baptismDate.value = '' as any
})
</script>

<template>
  <form @submit.prevent="onSubmit" class="grid gap-4">
    <div class="grid gap-1">
      <Label>Cédula</Label>
      <Input name="idNumber" v-model="idNumber" v-bind="idNumberAttrs" />
      <span class="text-xs text-red-600">{{ errors.cedula }}</span>
    </div>
    <div class="grid gap-1 md:grid-cols-2">
      <div>
        <Label>Nombres</Label>
        <Input
          name="firstNames"
          v-model="firstNames"
          v-bind="firstNamesAttrs"
        />
        <span class="text-xs text-red-600">{{ errors.nombres }}</span>
      </div>
      <div>
        <Label>Apellidos</Label>
        <Input name="lastNames" v-model="lastNames" v-bind="lastNamesAttrs" />
        <span class="text-xs text-red-600">{{ errors.apellidos }}</span>
      </div>
    </div>
    <div class="grid gap-1 md:grid-cols-2">
      <div>
        <Label>Teléfono</Label>
        <Input name="phone" v-model="phone" v-bind="phoneAttrs" />
      </div>
      <div>
        <Label>Dirección</Label>
        <Input name="address" v-model="address" v-bind="addressAttrs" />
      </div>
    </div>
    <div class="grid items-end gap-1 md:grid-cols-2">
      <div>
        <Label>Correo</Label>
        <Input name="email" v-model="email" v-bind="emailAttrs" type="email" />
        <span class="text-xs text-red-600">{{ errors.correo }}</span>
      </div>
      <div v-if="baptized">
        <Label>Fecha de Bautizo</Label>
        <Input
          name="baptismDate"
          v-model="baptismDate"
          v-bind="baptismDateAttrs"
          type="date"
        />
      </div>
    </div>
    <div class="flex items-center gap-6">
      <div class="flex items-center gap-2">
        <Switch v-model="baptized" v-bind="baptizedAttrs" />
        <Label>¿Bautizado?</Label>
      </div>
      <div class="flex items-center gap-2">
        <Switch v-model="whatsapp" v-bind="whatsappAttrs" />
        <Label>¿Pertenece al grupo de WhatsApp?</Label>
      </div>
    </div>
    <div class="flex justify-end gap-3">
      <Button :disabled="props.submitting">Guardar</Button>
    </div>
  </form>
</template>
