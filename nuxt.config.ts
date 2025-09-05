// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  compatibilityDate: '2025-09-04',
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
    '@nuxtjs/supabase',
    'radix-vue/nuxt',
  ],
  // Optimización de dependencias
  vite: {
    optimizeDeps: {
      include: [
        'vue-sonner',
        'vue-chartjs',
        'chart.js',
        '@supabase/supabase-js',
        'lucide-vue-next',
        'radix-vue',
        'vee-validate',
        '@vee-validate/zod',
        'zod',
      ],
    },
  },
  // css: ['@/assets/css/tailwind.css'],
  tailwindcss: { viewer: false },
  runtimeConfig: {
    public: {
      // Variables públicas para el cliente - exactamente como Supabase recomienda
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_KEY: process.env.SUPABASE_KEY,
    },
  },
  supabase: {
    redirectOptions: {
      login: '/auth/login',
      callback: '/auth/callback',
    },
  },
  // Configuraciones adicionales para mejor rendimiento
  experimental: {
    payloadExtraction: false,
  },
  nitro: {
    compressPublicAssets: true,
    esbuild: {
      options: {
        target: 'es2022',
      },
    },
  },
  // Configuración para Vercel
  ssr: true,
  // Configuración de build para Vercel
  build: {
    transpile: ['vue'],
  },
})
