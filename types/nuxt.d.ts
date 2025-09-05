// Declaraciones de tipos para Nuxt
declare global {
  // Nuxt Core
  const definePageMeta: (typeof import('#app'))['definePageMeta']
  const defineNuxtConfig: (typeof import('nuxt/config'))['defineNuxtConfig']
  const defineNuxtPlugin: (typeof import('#app'))['defineNuxtPlugin']
  const defineNuxtRouteMiddleware: (typeof import('#app'))['defineNuxtRouteMiddleware']
  const defineEventHandler: (typeof import('#app'))['defineEventHandler']

  // Nuxt Composables
  const useRuntimeConfig: (typeof import('#app'))['useRuntimeConfig']
  const useRouter: (typeof import('#app'))['useRouter']
  const useRoute: (typeof import('#app'))['useRoute']
  const navigateTo: (typeof import('#app'))['navigateTo']
  const readonly: (typeof import('vue'))['readonly']

  // Supabase
  const useSupabaseClient: (typeof import('#app'))['useSupabaseClient']
  const useSupabaseUser: (typeof import('#app'))['useSupabaseUser']
  const useSupabaseSession: (typeof import('#app'))['useSupabaseSession']
  const serverSupabaseClient: (typeof import('#app'))['serverSupabaseClient']

  // Server API
  const getRequestURL: (typeof import('#app'))['getRequestURL']
  const setResponseStatus: (typeof import('#app'))['setResponseStatus']
  const readBody: (typeof import('#app'))['readBody']
  const getRouterParam: (typeof import('#app'))['getRouterParam']

  // Node.js globals
  const process: any
  const require: any
  const console: any
}

export {}
