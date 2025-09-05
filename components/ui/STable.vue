<script setup lang="ts">
type SortDir = 'asc' | 'desc'

interface ColumnDef {
  key: string
  label: string
  sortable?: boolean
  visible?: boolean
  thClass?: string
  tdClass?: string
}

const props = defineProps<{
  rows: any[]
  columns: ColumnDef[]
  rowKey?: string
  enableSelection?: boolean
  selectedKeys?: string[]
  sortKey?: string
  sortDir?: SortDir
  density?: 'comfortable' | 'compact'
  showActions?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:selectedKeys', value: string[]): void
  (e: 'sortChange', key: string): void
}>()

const rowKeyName = computed(() => props.rowKey ?? 'id')
const selectedSet = computed(() => new Set(props.selectedKeys ?? []))

const pageAllSelected = computed(
  () =>
    props.rows.length > 0 &&
    props.rows.every(r => selectedSet.value.has(String(r[rowKeyName.value])))
)
const pageSomeSelected = computed(
  () =>
    props.rows.some(r => selectedSet.value.has(String(r[rowKeyName.value]))) &&
    !pageAllSelected.value
)

const rowPad = computed(() =>
  (props.density ?? 'comfortable') === 'compact' ? 'py-1' : 'py-2'
)

function getRowKey(r: any): string {
  return String(r[rowKeyName.value])
}

// Manage header checkbox indeterminate via DOM property to avoid SSR mismatch
const headerCheckbox = ref<HTMLInputElement | null>(null)
function syncHeaderIndeterminate() {
  if (headerCheckbox.value) {
    headerCheckbox.value.indeterminate =
      pageSomeSelected.value && !pageAllSelected.value
  }
}
onMounted(syncHeaderIndeterminate)
watch([pageSomeSelected, pageAllSelected], syncHeaderIndeterminate)

function toggleRow(key: string) {
  const set = new Set(selectedSet.value)
  if (set.has(key)) set.delete(key)
  else set.add(key)
  emit('update:selectedKeys', Array.from(set))
}

function toggleSelectAllPage() {
  const all = pageAllSelected.value
  const set = new Set(selectedSet.value)
  for (const r of props.rows) {
    const k = String(r[rowKeyName.value])
    if (all) set.delete(k)
    else set.add(k)
  }
  emit('update:selectedKeys', Array.from(set))
}

function onSort(colKey: string, sortable?: boolean) {
  if (!sortable) return
  emit('sortChange', colKey)
}
</script>

<template>
  <div class="w-full overflow-x-auto">
    <table
      class="relative min-w-[1100px] table-fixed divide-y divide-gray-300 dark:divide-white/15 md:min-w-full"
    >
      <thead>
        <tr>
          <th
            v-if="enableSelection"
            scope="col"
            class="relative px-7 sm:w-12 sm:px-6"
          >
            <div
              class="group absolute left-4 top-1/2 -mt-2 grid size-4 grid-cols-1"
            >
              <input
                type="checkbox"
                class="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-white/20 dark:bg-gray-800/50 dark:checked:border-indigo-500 dark:checked:bg-indigo-500 dark:indeterminate:border-indigo-500 dark:indeterminate:bg-indigo-500 dark:focus-visible:outline-indigo-500"
                ref="headerCheckbox"
                :checked="pageAllSelected"
                @change="toggleSelectAllPage"
              />
              <svg
                class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
                viewBox="0 0 14 14"
                fill="none"
              >
                <path
                  class="opacity-0"
                  :class="
                    pageAllSelected && !pageSomeSelected ? 'opacity-100' : ''
                  "
                  d="M3 8L6 11L11 3.5"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  class="opacity-0"
                  :class="pageSomeSelected ? 'opacity-100' : ''"
                  d="M3 7H11"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </th>

          <th
            v-for="col in columns"
            :key="col.key"
            v-show="col.visible !== false"
            scope="col"
            :class="[
              'px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white',
              col.sortable ? 'cursor-pointer' : '',
              col.thClass || '',
            ]"
            @click="onSort(col.key, col.sortable)"
          >
            {{ col.label }}
          </th>

          <th v-if="showActions" scope="col" class="py-3.5 pl-3 pr-4 sm:pr-3">
            <span class="sr-only">Acciones</span>
          </th>
        </tr>
      </thead>

      <tbody
        class="divide-y divide-gray-200 bg-white dark:divide-white/10 dark:bg-gray-900"
      >
        <tr v-for="r in rows" :key="getRowKey(r)" class="group">
          <td v-if="enableSelection" class="relative px-7 sm:w-12 sm:px-6">
            <div
              v-if="selectedSet.has(String(r[rowKeyName]))"
              class="absolute inset-y-0 left-0 w-0.5 bg-indigo-600 dark:bg-indigo-500"
            />
            <div class="absolute left-4 top-1/2 -mt-2 grid size-4 grid-cols-1">
              <input
                type="checkbox"
                class="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-white/20 dark:bg-gray-800/50 dark:checked:border-indigo-500 dark:checked:bg-indigo-500"
                :checked="selectedSet.has(getRowKey(r))"
                @change="toggleRow(getRowKey(r))"
              />
              <svg
                class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
                viewBox="0 0 14 14"
                fill="none"
              >
                <path
                  class="opacity-0"
                  :class="
                    selectedSet.has(String(r[rowKeyName])) ? 'opacity-100' : ''
                  "
                  d="M3 8L6 11L11 3.5"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </td>

          <template v-for="col in columns" :key="col.key">
            <td
              v-show="col.visible !== false"
              :class="[
                'whitespace-nowrap px-3 text-sm',
                rowPad,
                col.tdClass || '',
              ]"
            >
              <slot :name="'cell-' + col.key" :row="r">
                {{ r[col.key] ?? '—' }}
              </slot>
            </td>
          </template>

          <td
            v-if="showActions"
            class="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3"
          >
            <slot name="actions" :row="r" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
