<script setup lang="ts">
import Breadcrumb from '@/components/ui/Breadcrumb.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import DropdownMenu from '@/components/ui/DropdownMenu.vue'
import Input from '@/components/ui/Input.vue'
import Pagination from '@/components/ui/Pagination.vue'
import STable from '@/components/ui/STable.vue'
import { columnsUserTable } from '@/utils/STableUser'
import { useUsers } from '@/composables/useSupabase'
import { EyeIcon, MoreHorizontal, PencilIcon, TrashIcon } from 'lucide-vue-next'
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

definePageMeta({ middleware: 'auth', layout: 'dashboard' })

const { getUsers, deleteUser } = useUsers()

const users = ref<any[]>([])
const pending = ref(true)
const error = ref<string | null>(null)

const q = ref('')
const page = ref(1)
const pageSize = ref(10)
const pageSizeStr = ref(String(pageSize.value))
watch(pageSizeStr, val => {
  const n = parseInt(String(val), 10)
  if (!Number.isNaN(n)) pageSize.value = n
  page.value = 1
})

const filtered = computed(() => {
  if (!q.value) return users.value
  const term = q.value.toLowerCase()
  return users.value.filter(u =>
    [u.idNumber, u.firstNames, u.lastNames, u.email].some((v: string) =>
      (v || '').toLowerCase().includes(term)
    )
  )
})

// Ordenamiento y preferencias de tabla
const sortKey = ref<
  'created_at' | 'idNumber' | 'firstNames' | 'lastNames' | 'email'
>('created_at')
const sortDir = ref<'asc' | 'desc'>('desc')
const toggleSort = (key: typeof sortKey.value) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

const sorted = computed(() => {
  const list = [...filtered.value]
  return list.sort((a: any, b: any) => {
    let na: any, nb: any
    if (sortKey.value === 'created_at') {
      na = new Date(a.created_at).getTime() || 0
      nb = new Date(b.created_at).getTime() || 0
    } else {
      na = (a?.[sortKey.value] ?? '').toString().toLowerCase()
      nb = (b?.[sortKey.value] ?? '').toString().toLowerCase()
    }
    if (na < nb) return sortDir.value === 'asc' ? -1 : 1
    if (na > nb) return sortDir.value === 'asc' ? 1 : -1
    return 0
  })
})

const visible = reactive({
  phone: true,
  baptism: true,
  whatsapp: true,
  actions: true,
})
const density = ref<'comfortable' | 'compact'>('comfortable')
const rowPad = computed(() => (density.value === 'compact' ? 'py-1' : 'py-2'))

// UI helpers
const initials = (firstNames: string, lastNames: string) => {
  const n = (firstNames || '').trim().split(' ')[0]?.[0] || ''
  const a = (lastNames || '').trim().split(' ')[0]?.[0] || ''
  return (n + a).toUpperCase()
}

// (sin tema forzado: seguimos el tema por defecto claro)

// Selección múltiple
const selectedIds = reactive(new Set<string>())
const isSelected = (id: string) => selectedIds.has(id)
const toggleSelect = (id: string) => {
  if (selectedIds.has(id)) selectedIds.delete(id)
  else selectedIds.add(id)
}
const pageAllSelected = computed(
  () => paged.value.length > 0 && paged.value.every(u => selectedIds.has(u.id))
)
const pageSomeSelected = computed(
  () => paged.value.some(u => selectedIds.has(u.id)) && !pageAllSelected.value
)
const toggleSelectAllPage = () => {
  if (pageAllSelected.value) {
    paged.value.forEach(u => selectedIds.delete(u.id))
  } else {
    paged.value.forEach(u => selectedIds.add(u.id))
  }
}

const clearSelection = () => selectedIds.clear()

const deleteSelected = async () => {
  if (!selectedIds.size) return
  try {
    pending.value = true
    const ids = Array.from(selectedIds)
    for (const id of ids) {
      await deleteUser(id)
    }
    toast.success(`Eliminados ${ids.length} usuarios`)
    clearSelection()
    await loadUsers()
  } catch (e: any) {
    toast.error(e.message || 'Error al eliminar usuarios')
  } finally {
    pending.value = false
  }
}

const exportSelectedCSV = () => {
  if (!selectedIds.size) return
  const rows = users.value.filter((u: any) => selectedIds.has(String(u.id)))
  console.log('[export][csv] selectedIds:', Array.from(selectedIds))
  console.log('[export][csv] rows:', rows)
  const headers = [
    'idNumber',
    'firstNames',
    'lastNames',
    'email',
    'phone',
    'baptismDate',
    'whatsapp',
  ]
  const csv = [headers.join(',')]
    .concat(
      rows.map((u: any) =>
        headers.map(h => JSON.stringify(u[h] ?? '')).join(',')
      )
    )
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'usuarios_seleccionados.csv'
  a.click()
  URL.revokeObjectURL(url)
}

const exportSelectedPDF = () => {
  if (!selectedIds.size) return
  const rows = users.value.filter((u: any) => selectedIds.has(String(u.id)))
  console.log('[export][pdf] selectedIds:', Array.from(selectedIds))
  console.log('[export][pdf] rows:', rows)
  const headers = [
    'Cédula',
    'Nombres',
    'Apellidos',
    'Correo',
    'Teléfono',
    'Bautizo',
    'WhatsApp',
  ]
  const bodyRows = rows.map((u: any) => [
    u.idNumber,
    u.firstNames,
    u.lastNames,
    u.email || '',
    u.phone || '',
    u.baptismDate ? new Date(u.baptismDate).toLocaleDateString() : 'No',
    u.whatsapp ? 'Sí' : 'No',
  ])
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Usuarios seleccionados</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,"Helvetica Neue",Arial,sans-serif;padding:24px}h1{font-size:16px;margin:0 0 12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px 8px;font-size:12px;text-align:left}th{background:#f7f7f7}</style></head><body><h1>Usuarios seleccionados</h1><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${bodyRows.map(r => `<tr>${r.map(c => `<td>${String(c).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`
  const w = window.open('', '_blank')
  if (!w) return
  w.document.open()
  w.document.write(html)
  w.document.close()
  w.focus()
  w.print()
}

const selectedArray = computed<string[]>({
  get() {
    return Array.from(selectedIds)
  },
  set(newVal: string[]) {
    selectedIds.clear()
    for (const id of newVal) selectedIds.add(id)
  },
})

// Adapt sort event from STable (string) to our typed toggleSort
const onSTableSort = (key: string) => toggleSort(key as any)

// Export selector and handler
const exportType = ref<'csv' | 'pdf'>('csv')
const doExport = () => {
  if (!selectedIds.size) return
  console.log('[export] type:', exportType.value)
  if (exportType.value === 'csv') return exportSelectedCSV()
  return exportSelectedPDF()
}
const showExportPicker = ref(false)

const pageCount = computed(() =>
  Math.max(1, Math.ceil(sorted.value.length / pageSize.value))
)
watch([filtered, pageSize], () => {
  page.value = 1
})

const paged = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return sorted.value.slice(start, start + pageSize.value)
})

// Consistent date formatting across SSR/Client to avoid hydration mismatches
const dateFormatter = new Intl.DateTimeFormat('es-ES', { timeZone: 'UTC' })
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'No'
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return 'No'
  return dateFormatter.format(d)
}

const loadUsers = async () => {
  try {
    pending.value = true
    error.value = null
    users.value = await getUsers()
  } catch (e: any) {
    error.value = e.message
    toast.error('Error al cargar usuarios')
  } finally {
    pending.value = false
  }
}

const remove = async (id: string) => {
  try {
    await deleteUser(id)
    toast.success('Usuario eliminado')
    await loadUsers()
  } catch (e: any) {
    toast.error(e.message || 'Error al eliminar usuario')
  }
}

onMounted(() => {
  loadUsers()
})
</script>
<template>
  <section class="space-y-4 p-6">
    <Breadcrumb
      :items="[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Usuarios' },
      ]"
    />

    <Card
      class="space-y-4 border border-brand-100 bg-white/70 p-4 backdrop-blur"
    >
      <div class="flex items-center justify-between gap-3">
        <div class="flex w-full items-center gap-3">
          <div class="w-64">
            <Input
              v-model="q"
              placeholder="Buscar por cédula, nombre o correo"
              class="focus:ring-2 focus:ring-brand-300"
            />
          </div>
          <ClientOnly>
            <div class="text-sm text-brand-700">
              {{ filtered.length }} resultados
            </div>
            <template #fallback>
              <div class="text-sm text-brand-700">0 resultados</div>
            </template>
          </ClientOnly>
        </div>
        <DropdownMenu>
          <template #trigger="{ Trigger }">
            <Trigger as-child>
              <Button variant="outline">Vista</Button>
            </Trigger>
          </template>
          <template #default="{ Item, Label, Separator }">
            <Label class="text-xs">Columnas</Label>
            <Item @select="visible.phone = !visible.phone">
              <span class="mr-2">{{ visible.phone ? '✓' : '' }}</span>
              Teléfono
            </Item>
            <Item @select="visible.baptism = !visible.baptism">
              <span class="mr-2">{{ visible.baptism ? '✓' : '' }}</span> Bautizo
            </Item>
            <Item @select="visible.whatsapp = !visible.whatsapp">
              <span class="mr-2">{{ visible.whatsapp ? '✓' : '' }}</span>
              WhatsApp
            </Item>
            <Item @select="visible.actions = !visible.actions">
              <span class="mr-2">{{ visible.actions ? '✓' : '' }}</span>
              Acciones
            </Item>
            <Separator />
            <Label class="text-xs">Densidad</Label>
            <Item @select="density = 'comfortable'">Cómoda</Item>
            <Item @select="density = 'compact'">Compacta</Item>
          </template>
        </DropdownMenu>
        <DropdownMenu v-if="selectedIds.size">
          <template #trigger="{ Trigger }">
            <Trigger as-child>
              <Button variant="default"
                >Exportar ({{ selectedIds.size }})</Button
              >
            </Trigger>
          </template>
          <template #default="{ Item, Separator, Label }">
            <Label class="text-xs">Tipo</Label>
            <div class="px-3 py-2">
              <select
                v-model="exportType"
                class="h-8 w-40 rounded-md border px-2 text-sm"
              >
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
            <Item @select="doExport">Descargar</Item>
            <Separator />
            <Item @select="deleteSelected"
              ><span class="text-red-600">Eliminar seleccionados</span></Item
            >
          </template>
        </DropdownMenu>
        <NuxtLink to="/dashboard/users/new">
          <Button>Nuevo</Button>
        </NuxtLink>
      </div>

      <div v-if="pending">Cargando…</div>
      <p v-else-if="error" class="text-red-600">Error: {{ error }}</p>
      <div v-else class="space-y-3">
        <div class="group/table relative">
          <div
            class="group-has-checked/table:flex absolute left-14 top-0 hidden h-12 items-center space-x-3 bg-white dark:bg-gray-900 sm:left-12"
          >
            <button
              type="button"
              class="shadow-xs inset-ring inset-ring-gray-300 dark:inset-ring-white/10 inline-flex items-center rounded-sm bg-white px-2 py-1 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
              :disabled="!selectedIds.size"
              @click="showExportPicker ? doExport() : (showExportPicker = true)"
            >
              Exportar
            </button>
            <div v-if="showExportPicker" class="flex items-center gap-2">
              <select
                v-model="exportType"
                class="h-8 rounded-md border px-2 text-sm"
              >
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
              <button
                type="button"
                class="shadow-xs inset-ring inset-ring-gray-300 dark:inset-ring-white/10 inline-flex items-center rounded-sm bg-white px-2 py-1 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                @click="doExport"
              >
                Descargar
              </button>
            </div>
            <button
              type="button"
              class="shadow-xs inset-ring inset-ring-gray-300 dark:inset-ring-white/10 inline-flex items-center rounded-sm bg-white px-2 py-1 text-sm font-semibold text-red-600 hover:bg-gray-50 dark:bg-white/10 dark:text-red-400 dark:hover:bg-white/15"
              :disabled="!selectedIds.size"
              @click="deleteSelected"
            >
              Eliminar
            </button>
          </div>

          <ClientOnly>
            <STable
              :rows="paged"
              :columns="columnsUserTable"
              :enable-selection="true"
              v-model:selectedKeys="selectedArray"
              :density="density"
              :show-actions="visible.actions"
              @sortChange="onSTableSort"
            >
              <template #cell-avatar="{ row }">
                <div
                  class="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800"
                >
                  {{ initials(row.nombres, row.apellidos) }}
                </div>
              </template>

              <template #cell-cedula="{ row }">
                <NuxtLink
                  class="text-brand-700 hover:text-brand-900"
                  :to="`/dashboard/users/${row.id}`"
                  >{{ row.cedula }}</NuxtLink
                >
              </template>

              <template #cell-correo="{ row }">
                <span v-if="row.correo">{{ row.correo }}</span>
                <span v-else class="text-gray-400">Sin correo</span>
              </template>

              <template #cell-fecha_bautizo="{ row }">
                <span
                  v-if="row.fecha_bautizo"
                  class="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-800 ring-1 ring-brand-200"
                  >{{ formatDate(row.fecha_bautizo) }}</span
                >
                <span
                  v-else
                  class="rounded-md bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-700 ring-1 ring-warning-200"
                  >No</span
                >
              </template>

              <template #cell-whatsapp="{ row }">
                <span
                  v-if="row.whatsapp"
                  class="rounded-md bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700 ring-1 ring-success-200"
                  >Sí</span
                >
                <span
                  v-else
                  class="rounded-md bg-danger-50 px-2 py-0.5 text-xs font-medium text-danger-700 ring-1 ring-danger-200"
                  >No</span
                >
              </template>

              <template #actions="{ row }">
                <DropdownMenu>
                  <template #trigger="{ Trigger }">
                    <Trigger as-child>
                      <Button variant="ghost" class="h-8 px-2"
                        ><MoreHorizontal class="h-4 w-4"
                      /></Button>
                    </Trigger>
                  </template>
                  <template #default="{ Item, Separator }">
                    <Item>
                      <NuxtLink
                        :to="`/dashboard/users/${row.id}`"
                        class="flex items-center gap-2"
                        ><EyeIcon class="h-4 w-4" /> Ver</NuxtLink
                      >
                    </Item>
                    <Item>
                      <NuxtLink
                        :to="`/dashboard/users/${row.id}`"
                        class="flex items-center gap-2"
                        ><PencilIcon class="h-4 w-4" /> Editar</NuxtLink
                      >
                    </Item>
                    <Separator />
                    <Item class="flex items-center gap-2">
                      <ClientOnly>
                        <AlertDialogRoot>
                          <AlertDialogTrigger as-child>
                            <button
                              class="flex items-center gap-2 text-red-600"
                            >
                              <TrashIcon class="h-4 w-4" /> Eliminar
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogTitle
                              >Eliminar usuario</AlertDialogTitle
                            >
                            <AlertDialogDescription
                              >Esta acción no se puede
                              deshacer.</AlertDialogDescription
                            >
                            <div class="mt-4 flex justify-end gap-3">
                              <AlertDialogCancel
                                class="rounded border px-3 py-1"
                                >Cancelar</AlertDialogCancel
                              >
                              <AlertDialogAction
                                @click="remove(row.id)"
                                class="rounded bg-red-600 px-3 py-1 text-white"
                                >Eliminar</AlertDialogAction
                              >
                            </div>
                          </AlertDialogContent>
                        </AlertDialogRoot>
                      </ClientOnly>
                    </Item>
                  </template>
                </DropdownMenu>
              </template>
            </STable>
          </ClientOnly>
        </div>
      </div>
      <div class="flex flex-col items-center justify-between gap-2 md:flex-row">
        <div class="flex items-center gap-2">
          <span class="text-muted-foreground text-sm">Mostrar</span>
          <select
            class="h-10 rounded-md border px-2 text-sm"
            v-model.number="pageSize"
            @change="page = 1"
          >
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
          <span class="text-muted-foreground text-sm">registros</span>
        </div>
        <ClientOnly>
          <div class="flex w-full items-center justify-center">
            <Pagination
              :page="page"
              :page-count="pageCount"
              @update:page="(val: any) => (page = val)"
            />
          </div>
        </ClientOnly>
      </div>
    </Card>
  </section>
</template>
