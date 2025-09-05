<script setup lang="ts">
import Dropzone from '@/components/import/Dropzone.vue'
import ImportTable from '@/components/import/ImportTable.vue'
import Button from '@/components/ui/Button.vue'
import Progress from '@/components/ui/Progress.vue'
import { toast } from 'vue-sonner'

definePageMeta({ middleware: 'auth', layout: 'dashboard' })

interface ProcessedUser {
  idNumber: string
  firstNames: string
  lastNames: string
  phone: string
  address: string
  email: string
  baptismDate: string | null
  whatsapp: boolean
  password: string
}

const file = ref<File | null>(null)
const fileName = ref<string>('')
const rows = ref<ProcessedUser[]>([])
const warnings = ref<string[]>([])
const parsing = ref(false)
const importing = ref(false)
const progress = ref(0)
const result = ref<{ success: number; failed: number; skipped: number } | null>(
  null
)

const handleFileData = (data: ProcessedUser[]) => {
  rows.value = data
  result.value = null
  progress.value = 0
}

const handleWarnings = (warningsData: string[]) => {
  warnings.value = warningsData
}

const resetAll = () => {
  file.value = null
  fileName.value = ''
  rows.value = []
  warnings.value = []
  parsing.value = false
  importing.value = false
  progress.value = 0
  result.value = null
}

const runImport = async () => {
  if (!rows.value.length) return
  importing.value = true
  result.value = { success: 0, failed: 0, skipped: 0 }
  progress.value = 0

  const total = rows.value.length
  const batchSize = 50 // Reducir tamaño del batch para Supabase

  for (let i = 0; i < total; i += batchSize) {
    const batch = rows.value.slice(i, i + batchSize)
    try {
      // Transformar datos para Supabase
      const usersToImport = batch.map(user => ({
        idNumber: user.idNumber,
        firstNames: user.firstNames,
        lastNames: user.lastNames,
        phone: user.phone || '',
        address: user.address || '',
        email: user.email || '',
        baptismDate: user.baptismDate || null,
        whatsapp: user.whatsapp,
        password_hash: user.password,
        role: 'usuario' as const,
      }))

      const { importUsers } = useUsers()
      await importUsers(usersToImport)

      result.value!.success += batch.length
    } catch (e: any) {
      console.error('Error importando batch:', e)
      result.value!.failed += batch.length
    }

    progress.value = Math.round(((i + batch.length) / total) * 100)
    // Pausa corta para no saturar
    if (i + batchSize < total) await new Promise(r => setTimeout(r, 500))
  }

  importing.value = false
  toast.success(
    `Importación completada: ${result.value.success} ok, ${result.value.failed} errores, ${result.value.skipped} omitidos`
  )
}
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">Importar usuarios</h2>
      <div class="flex items-center gap-2" v-if="rows.length || file">
        <Button variant="outline" @click="resetAll">Reiniciar</Button>
      </div>
    </div>

    <div class="max-w-4xl space-y-4">
      <Dropzone @fileData="handleFileData" @warnings="handleWarnings" />

      <div
        v-if="warnings.length > 0"
        class="rounded-md border border-amber-200 bg-amber-50 p-4"
      >
        <div class="mb-2 flex items-center gap-2 text-amber-600">
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <span class="font-medium">Advertencias del archivo:</span>
        </div>
        <ul class="list-disc space-y-1 pl-5 text-sm text-amber-700">
          <li v-for="(warning, idx) in warnings" :key="idx">{{ warning }}</li>
        </ul>
      </div>

      <div v-if="rows.length" class="space-y-3">
        <div class="text-muted-foreground text-sm">
          Se encontraron {{ rows.length }} registros para importar
        </div>
        <ImportTable :data="rows" :max-rows="50" />
        <div class="space-y-2">
          <Progress :value="progress" />
          <div class="flex items-center gap-3">
            <Button :disabled="importing" @click="runImport">
              <span v-if="importing" class="flex items-center gap-2">
                <div
                  class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                ></div>
                Importando...
              </span>
              <span v-else>Importar</span>
            </Button>
            <span v-if="result" class="text-muted-foreground text-sm">
              {{ result.success }} ok, {{ result.failed }} errores,
              {{ result.skipped }} omitidos
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
