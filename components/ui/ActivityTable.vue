<script setup lang="ts">
import Checkbox from '@/components/ui/Checkbox.vue'

type ActivityUser = { name: string; imageUrl: string }
type ActivityItem = {
  user: ActivityUser
  commit: string
  branch: string
  status: string
  duration: string
  date: string
  dateTime: string
}

const props = withDefaults(
  defineProps<{
    items: ActivityItem[]
    selected?: string[]
    selectable?: boolean
    idKey?: keyof ActivityItem
    title?: string
  }>(),
  {
    selectable: true,
    idKey: 'commit',
    title: 'Última actividad',
  }
)

const emit = defineEmits<{ (e: 'update:selected', value: string[]): void }>()

const selectedSet = ref(new Set<string>(props.selected || []))
watch(
  () => props.selected,
  val => {
    if (Array.isArray(val)) selectedSet.value = new Set(val)
  }
)
watch(selectedSet, set => emit('update:selected', Array.from(set)), {
  deep: true,
})

const isSelected = (id: string) => selectedSet.value.has(id)
const toggleRow = (id: string) => {
  if (selectedSet.value.has(id)) selectedSet.value.delete(id)
  else selectedSet.value.add(id)
}

const allSelected = computed(
  () =>
    props.items.length > 0 &&
    props.items.every(it => selectedSet.value.has(String(it[props.idKey])))
)
const someSelected = computed(
  () =>
    props.items.some(it => selectedSet.value.has(String(it[props.idKey]))) &&
    !allSelected.value
)
const toggleAll = () => {
  if (allSelected.value)
    props.items.forEach(it => selectedSet.value.delete(String(it[props.idKey])))
  else props.items.forEach(it => selectedSet.value.add(String(it[props.idKey])))
}

const statusClasses = (status: string) =>
  status.toLowerCase() === 'completed'
    ? 'bg-success-500/10 text-success-600 dark:bg-success-500/15 dark:text-success-400'
    : 'bg-danger-500/10 text-danger-600 dark:bg-danger-500/15 dark:text-danger-400'
</script>

<template>
  <section class="bg-white py-4 dark:bg-gray-900">
    <h2
      class="px-4 text-base/7 font-semibold text-brand-900 dark:text-white sm:px-6 lg:px-8"
    >
      {{ title }}
    </h2>

    <div
      class="mt-3 overflow-hidden rounded-lg border border-brand-100 bg-white/70 backdrop-blur dark:border-white/10"
    >
      <table class="w-full whitespace-nowrap text-left">
        <colgroup>
          <col v-if="selectable" class="w-10" />
          <col class="w-full sm:w-4/12" />
          <col class="lg:w-4/12" />
          <col class="lg:w-2/12" />
          <col class="lg:w-1/12" />
          <col class="lg:w-1/12" />
        </colgroup>

        <thead
          class="sticky top-0 border-b border-brand-100 bg-brand-50/70 text-sm/6 text-brand-900 dark:border-white/15 dark:bg-white/5 dark:text-white"
        >
          <tr>
            <th
              v-if="selectable"
              scope="col"
              class="py-2 pl-4 pr-2 sm:pl-6 lg:pl-8"
            >
              <Checkbox
                :checked="allSelected"
                :indeterminate="someSelected"
                @update:checked="toggleAll"
              />
            </th>
            <th
              scope="col"
              class="py-2 pl-4 pr-8 font-semibold sm:pl-6 lg:pl-8"
            >
              Usuario
            </th>
            <th
              scope="col"
              class="hidden py-2 pl-0 pr-8 font-semibold sm:table-cell"
            >
              Commit
            </th>
            <th
              scope="col"
              class="py-2 pl-0 pr-4 text-right font-semibold sm:pr-8 sm:text-left lg:pr-20"
            >
              Estado
            </th>
            <th
              scope="col"
              class="hidden py-2 pl-0 pr-8 font-semibold md:table-cell lg:pr-20"
            >
              Duración
            </th>
            <th
              scope="col"
              class="hidden py-2 pl-0 pr-4 text-right font-semibold sm:table-cell sm:pr-6 lg:pr-8"
            >
              Fecha
            </th>
          </tr>
        </thead>

        <tbody
          class="divide-y divide-brand-100/80 text-sm dark:divide-white/10"
        >
          <tr
            v-for="item in props.items"
            :key="item.commit"
            class="hover:bg-brand-50/50 dark:hover:bg-white/5"
          >
            <td v-if="selectable" class="py-3 pl-4 pr-2 sm:pl-6 lg:pl-8">
              <Checkbox
                :checked="isSelected(String(item[props.idKey]))"
                @update:checked="() => toggleRow(String(item[props.idKey]))"
              />
            </td>
            <td class="py-4 pl-4 pr-8 sm:pl-6 lg:pl-8">
              <div class="flex items-center gap-x-4">
                <img
                  :src="item.user.imageUrl"
                  alt=""
                  class="size-8 rounded-full bg-brand-50 dark:bg-gray-800 dark:outline dark:outline-white/10"
                />
                <div
                  class="truncate font-medium text-brand-900 dark:text-white"
                >
                  {{ item.user.name }}
                </div>
              </div>
            </td>

            <td class="hidden py-4 pl-0 pr-4 sm:table-cell sm:pr-8">
              <div class="flex gap-x-3">
                <div class="font-mono text-gray-600 dark:text-gray-400">
                  {{ item.commit }}
                </div>
                <div
                  class="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-800 outline-1 outline-brand-100 dark:bg-white/10 dark:text-gray-300 dark:-outline-offset-1 dark:outline-white/10"
                >
                  {{ item.branch }}
                </div>
              </div>
            </td>

            <td class="py-4 pl-0 pr-4 sm:pr-8 lg:pr-20">
              <div
                class="flex items-center justify-end gap-x-2 sm:justify-start"
              >
                <time
                  class="text-gray-500 dark:text-gray-400 sm:hidden"
                  :datetime="item.dateTime"
                  >{{ item.date }}</time
                >
                <div
                  class="flex-none rounded-full p-1"
                  :class="statusClasses(item.status)"
                >
                  <div class="size-1.5 rounded-full bg-current" />
                </div>
                <span
                  class="hidden rounded-full px-2 py-0.5 text-xs font-medium sm:block"
                  :class="
                    item.status.toLowerCase() === 'completed'
                      ? 'bg-success-50 text-success-700 ring-1 ring-success-200'
                      : 'bg-danger-50 text-danger-700 ring-1 ring-danger-200'
                  "
                >
                  {{ item.status }}
                </span>
              </div>
            </td>

            <td
              class="hidden py-4 pl-0 pr-8 text-gray-600 dark:text-gray-400 md:table-cell lg:pr-20"
            >
              {{ item.duration }}
            </td>
            <td
              class="hidden py-4 pl-0 pr-4 text-right text-gray-600 dark:text-gray-400 sm:table-cell sm:pr-6 lg:pr-8"
            >
              <time :datetime="item.dateTime">{{ item.date }}</time>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
