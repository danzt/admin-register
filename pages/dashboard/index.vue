<script setup lang="ts">
import Card from '@/components/ui/Card.vue'
import BarUsersByMonth from '@/components/charts/BarUsersByMonth.vue'
import PieBaptismStatus from '@/components/charts/PieBaptismStatus.vue'
import { ref, onMounted } from 'vue'
import { useDashboardStats } from '@/composables/useSupabase'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { getSummaryStats, getUsersByMonth, getBaptismStatus } =
  useDashboardStats()

const loading = ref(true)
const stats = ref({
  totalUsers: 0,
  activeUsers: 0,
  inactiveUsers: 0,
  newUsersThisMonth: 0,
})
const usersByMonth = ref<{ name: string; usuarios: number }[]>([])
const baptismStatus = ref<{ name: string; value: number }[]>([])

onMounted(async () => {
  try {
    const [summaryStats, monthlyData, baptismData] = await Promise.all([
      getSummaryStats(),
      getUsersByMonth(),
      getBaptismStatus(),
    ])
    stats.value = summaryStats
    usersByMonth.value = monthlyData
    baptismStatus.value = baptismData
  } finally {
    loading.value = false
  }
})
</script>
<template>
  <section class="px-4 py-8 sm:px-6 lg:px-8">
    <div v-if="loading" class="text-sm text-gray-500 dark:text-gray-400">
      Cargando…
    </div>
    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card class="p-4">
        <div class="text-xs text-gray-500 dark:text-gray-400">
          Total Usuarios
        </div>
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ stats.totalUsers }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          +{{ stats.newUsersThisMonth }} este mes
        </div>
      </Card>
      <Card class="p-4">
        <div class="text-xs text-gray-500 dark:text-gray-400">
          Usuarios Activos
        </div>
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ stats.activeUsers }}
        </div>
      </Card>
      <Card class="p-4">
        <div class="text-xs text-gray-500 dark:text-gray-400">
          Usuarios Inactivos
        </div>
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ stats.inactiveUsers }}
        </div>
      </Card>
      <Card class="p-4">
        <div class="text-xs text-gray-500 dark:text-gray-400">
          Nuevos Usuarios
        </div>
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ stats.newUsersThisMonth }}
        </div>
      </Card>
    </div>
    <div v-if="!loading" class="mt-4 grid gap-4 lg:grid-cols-2">
      <Card class="p-4">
        <div class="mb-2 font-semibold text-gray-900 dark:text-white">
          Usuarios por Mes
        </div>
        <BarUsersByMonth :data="usersByMonth" />
      </Card>
      <Card class="p-4">
        <div class="mb-2 font-semibold text-gray-900 dark:text-white">
          Estado de Bautismo
        </div>
        <PieBaptismStatus :data="baptismStatus" />
      </Card>
    </div>
  </section>
</template>
