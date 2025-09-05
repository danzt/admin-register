<script setup lang="ts">
import Tabs from '@/components/ui/Tabs.vue'
import RolesTab from '@/components/config/RolesTab.vue'
import UsersRolesTab from '@/components/config/UsersRolesTab.vue'
import Breadcrumb from '@/components/ui/Breadcrumb.vue'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
</script>
<template>
  <section class="space-y-6">
    <Breadcrumb
      :items="[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Configuración' },
      ]"
    />
    <h1 class="text-2xl font-bold">Configuración</h1>
    <Tabs defaultValue="roles">
      <template #list="{ List, Trigger }">
        <List class="grid w-[360px] grid-cols-2">
          <Trigger value="roles" class="px-3 py-1">Roles y Permisos</Trigger>
          <Trigger value="users" class="px-3 py-1">Usuarios y Roles</Trigger>
        </List>
      </template>
      <template #content="{ Content }">
        <Content value="roles" class="mt-4">
          <RolesTab />
        </Content>
        <Content value="users" class="mt-4">
          <UsersRolesTab />
        </Content>
      </template>
    </Tabs>
  </section>
</template>
