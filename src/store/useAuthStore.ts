import { create } from 'zustand'
import type { AuthUser } from '../../shared/types'

type AuthState = {
  token: string | null
  user: AuthUser | null
  hydrate: () => void
  setSession: (token: string, user: AuthUser) => void
  logout: () => void
}

const STORAGE_KEY = 'splashwet-session'

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrate: () => {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return
    }

    try {
      const session = JSON.parse(raw) as { token?: string; user?: AuthUser }

      if (!session.token || !session.user?.id || !session.user?.username || !session.user?.role) {
        window.localStorage.removeItem(STORAGE_KEY)
        return
      }

      set({
        token: session.token,
        user: session.user,
      })
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  },
  setSession: (token, user) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }))
    set({ token, user })
  },
  logout: () => {
    window.localStorage.removeItem(STORAGE_KEY)
    set({ token: null, user: null })
  },
}))
