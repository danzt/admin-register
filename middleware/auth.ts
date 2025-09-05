export default defineNuxtRouteMiddleware(to => {
  const user = useSupabaseUser()
  // Protegemos únicamente /dashboard y subrutas
  if (to.path.startsWith('/dashboard') && !user.value) {
    return navigateTo('/auth/login')
  }
})
