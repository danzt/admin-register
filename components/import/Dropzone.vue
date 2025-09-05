<script setup lang="ts">
import { toast } from 'vue-sonner'
import * as XLSX from 'xlsx'

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

const emit = defineEmits<{
  fileData: [ProcessedUser[]]
  warnings: [string[]]
}>()

const dragging = ref(false)
const file = ref<File | null>(null)
const warnings = ref<string[]>([])
const accept = withDefaults(defineProps<{ accept?: string }>(), {
  accept: '.xlsx,.xls,.csv',
})

const onDragOver = (e: DragEvent) => {
  e.preventDefault()
  dragging.value = true
}

const onDragLeave = (e: DragEvent) => {
  e.preventDefault()
  dragging.value = false
}

const onDrop = (e: DragEvent) => {
  e.preventDefault()
  dragging.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) {
    setFile(f)
    processExcel(f)
  }
}

const fileInput = ref<HTMLInputElement | null>(null)
const onPick = () => fileInput.value?.click()

const onChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const f = target.files?.[0]
  if (f) {
    setFile(f)
    processExcel(f)
  }
  if (target) target.value = ''
}

const setFile = (f: File) => {
  file.value = f
  warnings.value = []
}

const removeFile = () => {
  file.value = null
  warnings.value = []
}

const processExcel = (file: File) => {
  const reader = new FileReader()
  reader.onload = e => {
    try {
      warnings.value = []
      const data = e.target?.result
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheet = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheet]

      // Convertir a JSON con encabezados
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 'A',
        blankrows: false,
        raw: false,
      })

      if (jsonData.length <= 1) {
        toast.error('El archivo no contiene datos suficientes')
        return
      }

      // Extraer los encabezados
      const headers = jsonData[1] as Record<string, any>

      // Identificar las columnas requeridas
      const idNumberIdx = Object.keys(headers).find(key =>
        headers[key]?.toString().toLowerCase().includes('cedula')
      )
      const firstNamesIdx = Object.keys(headers).find(key =>
        headers[key]?.toString().toLowerCase().includes('nombre')
      )
      const lastNamesIdx = Object.keys(headers).find(key =>
        headers[key]?.toString().toLowerCase().includes('apellido')
      )
      const phoneIdx = Object.keys(headers).find(key =>
        headers[key]?.toString().toLowerCase().includes('telefono')
      )
      const addressIdx = Object.keys(headers).find(key =>
        headers[key]?.toString().toLowerCase().includes('direcc')
      )
      const emailIdx = Object.keys(headers).find(key =>
        headers[key]?.toString().toLowerCase().includes('correo')
      )
      const baptismIdx = Object.keys(headers).find(key =>
        headers[key]?.toString().toLowerCase().includes('bautizo')
      )
      const whatsappIdx = Object.keys(headers).find(
        key =>
          headers[key]?.toString().toLowerCase().includes('whasa') ||
          headers[key]?.toString().toLowerCase().includes('whats')
      )

      const newWarnings: string[] = []

      if (!idNumberIdx) {
        newWarnings.push('No se encontró la columna para Cédula')
      }
      if (!firstNamesIdx) {
        newWarnings.push('No se encontró la columna para Nombres')
      }
      if (!lastNamesIdx) {
        newWarnings.push('No se encontró la columna para Apellidos')
      }

      if (!idNumberIdx && !firstNamesIdx && !lastNamesIdx) {
        toast.error(
          'El archivo no contiene las columnas mínimas requeridas (Cédula, Nombres, Apellidos)'
        )
        return
      }

      // Procesar los datos
      const processedData = jsonData
        .slice(1)
        .map((row: any, index) => {
          // Limpiar y formatear los datos
          const idNumber = idNumberIdx
            ? row[idNumberIdx]?.toString().trim() || ''
            : ''
          const firstNames = firstNamesIdx
            ? row[firstNamesIdx]?.toString().trim() || ''
            : ''
          const lastNames = lastNamesIdx
            ? row[lastNamesIdx]?.toString().trim() || ''
            : ''
          const phone = phoneIdx
            ? row[phoneIdx]?.toString().trim() || ''
            : ''
          const address = addressIdx
            ? row[addressIdx]?.toString().trim() || ''
            : ''
          const email = emailIdx
            ? row[emailIdx]?.toString().trim() || ''
            : ''

          // Verificar datos mínimos por fila
          if (!idNumber && !firstNames && !lastNames) {
            // Ignorar filas completamente vacías sin generar advertencia
            return null
          }

          // Verificar datos inválidos y registrar advertencias
          if (!idNumber) {
            newWarnings.push(
              `Fila ${index + 2}: Falta cédula para "${firstNames} ${lastNames}"`
            )
          }
          if (!firstNames && !lastNames) {
            newWarnings.push(
              `Fila ${index + 2}: Faltan nombre y apellido para cédula "${idNumber}"`
            )
          }

          // Validación y corrección de correo electrónico
          let emailValidated = email
          if (emailIdx && email) {
            if (!email.includes('@') || !email.includes('.')) {
              newWarnings.push(
                `Fila ${index + 2}: Correo inválido "${email}" para "${idNumber || firstNames}" - se asignará valor nulo`
              )
              emailValidated = '' // Se asignará null en la base de datos
            }
          }

          // Procesar fecha de bautizo
          let baptismDate = null
          let dateValid = false
          if (baptismIdx && row[baptismIdx]) {
            // Intentar interpretar la fecha en varios formatos
            if (typeof row[baptismIdx] === 'string') {
              const dateStr = row[baptismIdx].trim()
              // Intentar detectar diferentes formatos de fecha
              if (dateStr.includes('/')) {
                const parts = dateStr.split('/')
                if (parts.length === 3) {
                  try {
                    // Formato DD/MM/YYYY o MM/DD/YYYY
                    const year =
                      parts[2].length === 2 ? `20${parts[2]}` : parts[2]
                    const month = parts[1].padStart(2, '0')
                    const day = parts[0].padStart(2, '0')
                    const dateObj = new Date(`${year}-${month}-${day}`)

                    // Verificar si es una fecha válida
                    if (!isNaN(dateObj.getTime())) {
                      baptismDate = `${year}-${month}-${day}`
                      dateValid = true
                    }
                  } catch (e) {
                    // Fecha inválida - se mantendrá como null
                  }
                }
              } else if (dateStr.includes('-')) {
                try {
                  // Puede ser YYYY-MM-DD
                  const dateObj = new Date(dateStr)
                  if (!isNaN(dateObj.getTime())) {
                    baptismDate = dateStr
                    dateValid = true
                  }
                } catch (e) {
                  // Fecha inválida - se mantendrá como null
                }
              } else if (/^\d{4}$/.test(dateStr)) {
                // Solo año
                baptismDate = `${dateStr}-01-01`
                dateValid = true
              } else {
                // Intenta con month-year (Feb-10)
                const months: Record<string, string> = {
                  ene: '01',
                  feb: '02',
                  mar: '03',
                  abr: '04',
                  may: '05',
                  jun: '06',
                  jul: '07',
                  ago: '08',
                  sep: '09',
                  oct: '10',
                  nov: '11',
                  dic: '12',
                }

                const monthMatch = Object.keys(months).find(m =>
                  dateStr.toLowerCase().startsWith(m)
                )

                if (monthMatch) {
                  try {
                    const yearPart = dateStr.replace(/[a-zA-Z-]/g, '').trim()
                    const year =
                      yearPart.length === 2 ? `20${yearPart}` : yearPart
                    if (!isNaN(parseInt(year))) {
                      baptismDate = `${year}-${months[monthMatch]}-01`
                      dateValid = true
                    }
                  } catch (e) {
                    // Fecha inválida - se mantendrá como null
                  }
                }
              }

              if (!dateValid && dateStr) {
                newWarnings.push(
                  `Fila ${index + 2}: Fecha de bautizo inválida "${dateStr}" para "${idNumber || firstNames}" - se asignará valor nulo`
                )
              }
            }
          }

          // Procesar WhatsApp
          const whatsapp =
            whatsappIdx && row[whatsappIdx]
              ? row[whatsappIdx].toString().toLowerCase().includes('si') ||
                row[whatsappIdx].toString().toLowerCase() === 'true'
              : false

          return {
            idNumber,
            firstNames,
            lastNames,
            phone,
            address,
            email: emailValidated, // Correo validado o vacío
            baptismDate, // Fecha validada o null
            whatsapp,
            // Contraseña por defecto
            password: '12345678',
          }
        })
        .filter(item => item !== null) // Eliminar filas nulas

      if (processedData.length === 0) {
        toast.error('No se encontraron datos válidos en el archivo')
        return
      }

      // Limitar advertencias a 10 para no sobrecargar la interfaz
      if (newWarnings.length > 0) {
        warnings.value = newWarnings.slice(0, 10)
        if (newWarnings.length > 10) {
          warnings.value.push(
            `...y ${newWarnings.length - 10} advertencias más`
          )
        }

        toast.warning(
          `Se encontraron ${newWarnings.length} posibles problemas en los datos. Revisa las advertencias debajo.`
        )
      }

      emit('fileData', processedData)
      emit('warnings', warnings.value)

      toast.success(
        `Archivo procesado. Se encontraron ${processedData.length} registros para importar`
      )
    } catch (error) {
      console.error('Error al procesar el archivo Excel:', error)
      toast.error(
        'No se pudo procesar el archivo. Asegúrate de que sea un archivo Excel válido.'
      )
    }
  }

  reader.readAsArrayBuffer(file)
}
</script>

<template>
  <div class="space-y-6">
    <div
      class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors"
      :class="
        dragging
          ? 'border-primary bg-primary/10'
          : file
            ? 'border-green-500 bg-green-50'
            : 'hover:border-primary border-gray-300'
      "
      @click="onPick"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <div v-if="!file" class="space-y-4">
        <div class="h-12 w-12 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <div class="space-y-2">
          <h3 class="text-lg font-medium">
            Arrastra y suelta un archivo Excel o
          </h3>
          <p class="text-sm text-gray-500">Soporta archivos .xlsx y .xls</p>
          <span
            class="relative inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100"
          >
            Seleccionar archivo
          </span>
        </div>
      </div>

      <div v-else class="flex items-center space-x-4">
        <div class="h-8 w-8 text-green-500">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div class="flex-1">
          <p class="font-medium">{{ file.name }}</p>
          <p class="text-sm text-gray-500">
            {{ (file.size / 1024).toFixed(2) }} KB
          </p>
        </div>
        <button
          type="button"
          @click="removeFile"
          class="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

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
        <span class="font-medium">Advertencias:</span>
      </div>
      <ul class="list-disc space-y-1 pl-5 text-sm text-amber-700">
        <li v-for="(warning, idx) in warnings" :key="idx">{{ warning }}</li>
      </ul>
      <p class="mt-2 text-xs text-amber-600">
        Nota: Los usuarios con datos incorrectos serán ignorados durante la
        importación.
      </p>
    </div>

    <div class="space-y-2">
      <h4 class="font-medium">Formato esperado del archivo:</h4>
      <p class="text-sm text-gray-600">
        El archivo Excel debe contener las siguientes columnas (los nombres
        pueden variar):
      </p>
      <ul class="list-disc space-y-1 pl-5 text-sm text-gray-600">
        <li>Cédula/ID (obligatorio)</li>
        <li>Nombres (obligatorio)</li>
        <li>Apellidos (obligatorio)</li>
        <li>Teléfono</li>
        <li>Dirección</li>
        <li>Correo electrónico</li>
        <li>Fecha de bautizo</li>
        <li>WhatsApp (si/no)</li>
      </ul>
    </div>

    <input
      ref="fileInput"
      type="file"
      class="hidden"
      :accept="accept"
      @change="onChange"
    />
  </div>
</template>
