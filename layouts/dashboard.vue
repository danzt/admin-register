<script setup lang="ts">
import { useRoute } from '#imports'
import Button from '@/components/ui/Button.vue'
import { useAuth } from '@/composables/useAuth'
import { useSessionStore } from '@/stores/session'
import {
    ChartPieIcon,
    FileTextIcon,
    HomeIcon,
    MenuIcon,
    UsersIcon,
} from 'lucide-vue-next'
import {
    DropdownMenuArrow,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRoot,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from 'radix-vue'
import { computed, ref } from 'vue'

const route = useRoute()
const { logout } = useAuth()
const sidebarOpen = ref(false)
const session = useSessionStore()
const displayName = computed(
  () =>
    session.user?.user_metadata?.full_name || session.user?.email || 'Usuario'
)
const avatarUrl = computed(() => session.user?.user_metadata?.avatar_url || '')
const initials = computed(() => {
  const name = (
    session.user?.user_metadata?.full_name ||
    session.user?.email ||
    'U'
  ).toString()
  const parts = name.split(' ')
  const first = parts[0]?.[0] || 'U'
  const second = parts[1]?.[0] || ''
  return (first + second).toUpperCase()
})

const nav = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Usuarios', href: '/dashboard/users', icon: UsersIcon },
  {
    name: 'Registrar Usuario',
    href: '/dashboard/users/new',
    icon: UsersIcon,
  },
  {
    name: 'Configuración',
    href: '/dashboard/configuration',
    icon: FileTextIcon,
  },
  { name: 'Actividad', href: '/dashboard/activity', icon: ChartPieIcon },
]
</script>
<template>
  <div>
    <!-- Mobile top bar -->
    <div
      class="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm dark:bg-gray-900 sm:px-6 lg:hidden"
    >
      <button
        type="button"
        class="relative -m-2.5 p-2.5 text-gray-700 dark:text-gray-400 lg:hidden"
        @click="sidebarOpen = !sidebarOpen"
      >
        <span class="sr-only">Abrir menú</span>
        <MenuIcon class="h-6 w-6" />
      </button>
      <div
        class="relative flex-1 text-sm/6 font-semibold text-gray-900 dark:text-white"
      >
        Dashboard
      </div>
      <Button variant="outline" @click="logout">Salir</Button>
    </div>

    <!-- Mobile Drawer -->
    <div v-if="sidebarOpen" class="fixed inset-0 z-50 lg:hidden">
      <div class="absolute inset-0 bg-black/50" @click="sidebarOpen = false" />
      <aside
        class="relative h-full w-72 border-r bg-white p-6 dark:border-white/10 dark:bg-gray-900"
      >
        <nav class="flex flex-col gap-y-3">
          <NuxtLink
            v-for="item in nav"
            :key="item.href"
            :to="item.href"
            @click="sidebarOpen = false"
            :class="[
              route.path === item.href
                ? 'bg-gray-50 text-indigo-600 dark:bg-white/5 dark:text-white'
                : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold',
            ]"
          >
            <component :is="item.icon" class="h-5 w-5" />
            {{ item.name }}
          </NuxtLink>
          <div class="mt-auto pt-4">
            <Button variant="outline" class="w-full" @click="logout"
              >Cerrar sesión</Button
            >
          </div>
        </nav>
      </aside>
    </div>

    <!-- Static sidebar for desktop -->
    <div
      class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col"
    >
      <div
        class="relative flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 dark:border-white/10 dark:bg-gray-900"
      >
        <div class="relative flex h-16 shrink-0 items-center">
          <span class="font-semibold">AdministraSion</span>
        </div>
        <nav class="relative flex flex-1 flex-col">
          <ul role="list" class="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" class="-mx-2 space-y-1">
                <li v-for="item in nav" :key="item.name">
                  <NuxtLink
                    :to="item.href"
                    :class="[
                      route.path === item.href
                        ? 'bg-gray-50 text-indigo-600 dark:bg-white/5 dark:text-white'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
                      'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                    ]"
                  >
                    <component
                      :is="item.icon"
                      :class="[
                        route.path === item.href
                          ? 'text-indigo-600 dark:text-white'
                          : 'text-gray-400 group-hover:text-indigo-600 dark:text-gray-500 dark:group-hover:text-white',
                        'h-6 w-6 shrink-0',
                      ]"
                    />
                    {{ item.name }}
                  </NuxtLink>
                </li>
              </ul>
            </li>
            <li class="-mx-6 mt-auto">
              <ClientOnly>
                <DropdownMenuRoot>
                  <DropdownMenuTrigger
                    class="flex w-full items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
                  >
                    <div
                      v-if="avatarUrl"
                      class="size-8 overflow-hidden rounded-full"
                    >
                      <img
                        :src="avatarUrl"
                        class="h-full w-full object-cover"
                        alt="avatar"
                      />
                    </div>
                    <div
                      v-else
                      class="flex size-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800"
                    >
                      {{ initials }}
                    </div>
                    <span class="sr-only">Perfil</span>
                    <span aria-hidden="true">{{ displayName }}</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="top"
                    align="start"
                    :sideOffset="8"
                    class="z-50 w-60 rounded-lg border bg-white p-2 shadow-lg dark:border-white/10 dark:bg-gray-900"
                  >
                    <DropdownMenuLabel class="px-2 py-1.5">
                      <div class="flex items-center gap-3">
                        <div
                          v-if="avatarUrl"
                          class="size-8 overflow-hidden rounded-full"
                        >
                          <img
                            :src="avatarUrl"
                            class="h-full w-full object-cover"
                            alt="avatar"
                          />
                        </div>
                        <div
                          v-else
                          class="flex size-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800"
                        >
                          {{ initials }}
                        </div>
                        <div class="font-medium text-gray-900 dark:text-white">
                          {{ displayName }}
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator
                      class="dark:bg白/10 my-1 h-px bg-gray-200"
                    />
                    <DropdownMenuItem
                      :asChild="true"
                      class="rounded-md focus:bg-gray-50 dark:focus:bg-white/5"
                    >
                      <NuxtLink
                        to="/dashboard/configuration"
                        class="block w-full px-2 py-1.5 text-sm"
                        >Configuración</NuxtLink
                      >
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      :asChild="true"
                      class="rounded-md focus:bg-gray-50 dark:focus:bg-white/5"
                    >
                      <NuxtLink to="#" class="block w-full px-2 py-1.5 text-sm"
                        >Notificaciones</NuxtLink
                      >
                    </DropdownMenuItem>
                    <DropdownMenuSeparator
                      class="my-1 h-px bg-gray-200 dark:bg-white/10"
                    />
                    <DropdownMenuItem
                      class="rounded-md text-red-600 focus:bg-red-50 dark:focus:bg-white/5"
                      @select="logout"
                      >Cerrar sesión</DropdownMenuItem
                    >
                    <DropdownMenuArrow class="fill-white dark:fill-gray-900" />
                  </DropdownMenuContent>
                </DropdownMenuRoot>
              </ClientOnly>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Main content -->
    <main class="lg:pl-72">
      <div class="py-6">
        <div class="mx-auto w-full px-2">
          <slot />
        </div>
      </div>
    </main>
  </div>
</template>
