import { defineStore } from 'pinia'
import type { Session, User } from '@supabase/supabase-js'

interface SessionState {
  user: User | null
  session: Session | null
}

export const useSessionStore = defineStore('session', {
  state: (): SessionState => ({
    user: null,
    session: null,
  }),
  // Persistencia simple en localStorage (suficiente para el caso actual)
  persist: true,
  actions: {
    setSession(payload: { user: User | null; session: Session | null }) {
      this.user = payload.user
      this.session = payload.session
    },
    clear() {
      this.user = null
      this.session = null
    },
  },
})
