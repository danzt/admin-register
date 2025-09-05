<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps<{ data: { name: string; usuarios: number }[] }>()

const chartData = computed(() => ({
  labels: props.data.map(d => d.name),
  datasets: [
    {
      label: 'Usuarios',
      data: props.data.map(d => d.usuarios),
      backgroundColor: '#8884d8',
    },
  ],
}))

const options = { responsive: true, maintainAspectRatio: false }
</script>
<template>
  <div class="h-[300px]"><Bar :data="chartData" :options="options" /></div>
</template>
