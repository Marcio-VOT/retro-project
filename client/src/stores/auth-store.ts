import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { env } from '@/config/env'

interface User {
  id: string
  name: string
  email: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await fetch(`${env.API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Login failed')
          }

          const data = await response.json()
          
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await fetch(`${env.API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Registration failed')
          }

          const data = await response.json()
          
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        })
      },

      checkAuth: async () => {
        set({ isLoading: true })
        try {
          const token = get().token
          if (!token) {
            set({ isLoading: false })
            return
          }

          const response = await fetch(`${env.API_URL}/auth/me`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          if (response.ok) {
            const user = await response.json()
            set({ 
              user: { id: user.id, name: user.name, email: user.email }, 
              isAuthenticated: true, 
              isLoading: false 
            })
          } else {
            set({ 
              user: null, 
              token: null, 
              isAuthenticated: false, 
              isLoading: false 
            })
          }
        } catch (error) {
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false, 
            isLoading: false 
          })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
) 