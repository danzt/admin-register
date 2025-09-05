export const useAuth = () => {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const user = useSupabaseUser()

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error al cerrar sesión:', error)
      return
    }
    return router.replace('/auth/login')
  }

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  }

  const register = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error
    return data
  }

  const checkRole = async () => {
    if (!user.value) return null

    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('correo', user.value.email)
      .single()

    if (error) {
      console.error('Error al verificar rol:', error)
      return null
    }

    return data?.role || 'usuario'
  }

  return {
    user: readonly(user),
    logout,
    login,
    register,
    checkRole,
  }
}
