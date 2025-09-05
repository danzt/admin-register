import { useSessionStore } from '~/stores/session'

export default defineNuxtPlugin(() => {
  const supabase = useSupabaseClient()
  const store = useSessionStore()

  // Inicializa el estado al cargar
  supabase.auth.getSession().then(({ data }) => {
    store.setSession({
      user: data.session?.user ?? null,
      session: data.session ?? null,
    })
  })

  // Suscríbete a cambios de auth
  supabase.auth.onAuthStateChange((_event, session) => {
    store.setSession({ user: session?.user ?? null, session: session ?? null })
  })
})
