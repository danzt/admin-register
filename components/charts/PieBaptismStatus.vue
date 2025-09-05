<script setup lang="ts">
import { Pie } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from 'chart.js'
ChartJS.register(Title, Tooltip, Legend, ArcElement)

const props = defineProps<{ data: { name: string; value: number }[] }>()

const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

const chartData = computed(() => ({
  labels: props.data.map(d => d.name),
  datasets: [{ data: props.data.map(d => d.value), backgroundColor: colors }],
}))
const options = { responsive: true, maintainAspectRatio: false }
</script>
<template>
  <div class="h-[300px]"><Pie :data="chartData" :options="options" /></div>
</template>
