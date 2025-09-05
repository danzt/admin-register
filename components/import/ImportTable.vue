<script setup lang="ts">
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import DropdownMenu from '@/components/ui/DropdownMenu.vue'
import Table from '@/components/ui/Table.vue'

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

const props = withDefaults(
  defineProps<{
    data: ProcessedUser[]
    maxRows?: number
  }>(),
  {
    maxRows: 15,
  }
)

const currentPage = ref(1)
const totalPages = computed(() => Math.ceil(props.data.length / props.maxRows))

const startIndex = computed(() => (currentPage.value - 1) * props.maxRows)
const endIndex = computed(() => startIndex.value + props.maxRows)
const currentItems = computed(() =>
  props.data.slice(startIndex.value, endIndex.value)
)

const goToPage = (page: number) => {
  currentPage.value = Math.max(1, Math.min(page, totalPages.value))
}

const goToFirstPage = () => goToPage(1)
const goToLastPage = () => goToPage(totalPages.value)
const goToPreviousPage = () => goToPage(currentPage.value - 1)
const goToNextPage = () => goToPage(currentPage.value + 1)

// Resetear a la primera página cuando cambien los datos
watch(
  () => props.data,
  () => {
    currentPage.value = 1
  },
  { deep: true }
)

if (!props.data || props.data.length === 0) return null
</script>

<template>
  <div class="flex h-full flex-col rounded-md border">
    <div class="flex-grow overflow-x-auto">
      <Table class="w-full">
        <thead>
          <tr class="border-b text-left">
            <th class="w-12 px-2 py-2">Cédula</th>
            <th class="px-2 py-2">Nombre</th>
            <th class="px-2 py-2">Correo</th>
            <th class="px-2 py-2">Teléfono</th>
            <th class="hidden px-2 py-2 md:table-cell">Bautizo</th>
            <th class="hidden px-2 py-2 md:table-cell">WhatsApp</th>
            <th class="w-12 px-2 py-2 text-right">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(user, index) in currentItems"
            :key="startIndex + index"
            class="border-b"
          >
            <td class="px-2 py-1 font-medium">{{ user.idNumber }}</td>
            <td class="px-2 py-1">{{ `${user.firstNames} ${user.lastNames}` }}</td>
            <td class="px-2 py-1">
              <div v-if="user.email" class="flex items-center space-x-1">
                <svg
                  class="h-4 w-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span class="max-w-[150px] truncate">{{ user.email }}</span>
              </div>
              <span v-else class="text-sm text-gray-400">No disponible</span>
            </td>
            <td class="px-2 py-1">
              {{ user.phone || 'No disponible' }}
            </td>
            <td class="hidden px-2 py-1 md:table-cell">
              <Badge
                v-if="user.baptismDate"
                variant="outline"
                class="bg-blue-50"
              >
                {{ new Date(user.baptismDate).toLocaleDateString() }}
              </Badge>
              <span v-else class="text-sm text-gray-400">No</span>
            </td>
            <td class="hidden px-2 py-1 md:table-cell">
              <div v-if="user.whatsapp" class="h-5 w-5 text-green-500">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div v-else class="h-5 w-5 text-gray-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </td>
            <td class="px-2 py-1 text-right">
              <DropdownMenu>
                <Button variant="ghost" class="h-8 w-8 p-0">
                  <span class="sr-only">Abrir menú</span>
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
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </Button>
                <template #content>
                  <div class="text-xs">
                    <div class="cursor-pointer px-2 py-1 hover:bg-gray-100">
                      Ver detalles
                    </div>
                    <div class="cursor-pointer px-2 py-1 hover:bg-gray-100">
                      Editar antes de importar
                    </div>
                  </div>
                </template>
              </DropdownMenu>
            </td>
          </tr>
        </tbody>
      </Table>
    </div>

    <!-- Paginación -->
    <div
      v-if="totalPages > 1"
      class="flex items-center justify-between border-t px-4 py-3"
    >
      <div class="text-sm text-gray-700">
        Mostrando <span class="font-medium">{{ startIndex + 1 }}</span> a
        <span class="font-medium">{{
          Math.min(endIndex, props.data.length)
        }}</span>
        de <span class="font-medium">{{ props.data.length }}</span> registros
      </div>
      <div class="flex space-x-1">
        <Button
          variant="outline"
          size="sm"
          @click="goToFirstPage"
          :disabled="currentPage === 1"
          class="hidden sm:flex"
        >
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
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </Button>
        <Button
          variant="outline"
          size="sm"
          @click="goToPreviousPage"
          :disabled="currentPage === 1"
        >
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Button>

        <!-- Números de página -->
        <div class="flex space-x-1 sm:hidden">
          <span class="flex items-center px-2 text-sm">
            {{ currentPage }} / {{ totalPages }}
          </span>
        </div>

        <div class="hidden space-x-1 sm:flex">
          <template v-for="i in Math.min(5, totalPages)" :key="i">
            <Button
              :variant="
                currentPage ===
                (() => {
                  let pageNumber
                  if (totalPages <= 5) {
                    pageNumber = i
                  } else if (currentPage <= 3) {
                    pageNumber = i
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i
                  } else {
                    pageNumber = currentPage - 2 + i
                  }
                  return pageNumber
                })()
                  ? 'default'
                  : 'outline'
              "
              size="sm"
              @click="
                goToPage(
                  (() => {
                    let pageNumber
                    if (totalPages <= 5) {
                      pageNumber = i
                    } else if (currentPage <= 3) {
                      pageNumber = i
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i
                    } else {
                      pageNumber = currentPage - 2 + i
                    }
                    return pageNumber
                  })()
                )
              "
              class="w-9"
            >
              {{
                (() => {
                  let pageNumber
                  if (totalPages <= 5) {
                    pageNumber = i
                  } else if (currentPage <= 3) {
                    pageNumber = i
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i
                  } else {
                    pageNumber = currentPage - 2 + i
                  }
                  return pageNumber
                })()
              }}
            </Button>
          </template>
        </div>

        <Button
          variant="outline"
          size="sm"
          @click="goToNextPage"
          :disabled="currentPage === totalPages"
        >
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Button>
        <Button
          variant="outline"
          size="sm"
          @click="goToLastPage"
          :disabled="currentPage === totalPages"
          class="hidden sm:flex"
        >
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
              d="M13 5l7 7-7 7"
            />
          </svg>
        </Button>
      </div>
    </div>
  </div>
</template>
