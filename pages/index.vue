<template>
  <section class="p-6">
    <h1 class="text-2xl font-bold">
      Nuxt 3 + Pinia + Supabase + Drizzle + radix-vue
    </h1>
    <p class="text-muted-foreground mt-2">
      Proyecto base generado para la migración desde Next.js
    </p>
    <div class="mt-4 flex gap-4">
      <NuxtLink class="text-primary underline" to="/auth/login">Login</NuxtLink>
      <NuxtLink class="text-primary underline" to="/auth/register"
        >Registro</NuxtLink
      >
      <NuxtLink class="text-primary underline" to="/dashboard"
        >Dashboard</NuxtLink
      >
    </div>
  </section>
</template>
