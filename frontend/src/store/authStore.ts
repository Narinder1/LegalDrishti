import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Types
export type UserRole = 'admin' | 'user' | 'lawyer' | 'firm' | 'internal_team'

export interface User {
  id: number
  email: string
  role: UserRole
  full_name: string | null
  phone: string | null
  is_active: boolean
  is_verified: boolean
  created_at: string
  last_login: string | null
  lawyer_profile?: {
    bar_council_number: string | null
    practice_areas: string | null
    experience_years: number | null
    city: string | null
    state: string | null
    is_bar_verified: boolean
  } | null
  firm_profile?: {
    firm_name: string | null
    registration_number: string | null
    city: string | null
    state: string | null
    is_verified: boolean
  } | null
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

interface AuthState {
  // State
  user: User | null
  tokens: AuthTokens | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean

  // Actions
  login: (email: string, password: string) => Promise<boolean>
  register: (data: RegisterData) => Promise<{ success: boolean; message: string }>
  logout: () => void
  fetchUser: () => Promise<void>
  refreshToken: () => Promise<boolean>
  clearError: () => void
}

// Registration data types
export interface BaseRegisterData {
  email: string
  password: string
  confirm_password: string
  full_name: string
  phone?: string
  role: UserRole
}

export interface LawyerRegisterData extends BaseRegisterData {
  role: 'lawyer'
  bar_council_number?: string
  practice_areas?: string
  experience_years?: number
  court_jurisdiction?: string
  office_address?: string
  city?: string
  state?: string
  pincode?: string
}

export interface FirmRegisterData extends BaseRegisterData {
  role: 'firm'
  firm_name: string
  registration_number?: string
  established_year?: number
  website?: string
  office_address?: string
  city?: string
  state?: string
  pincode?: string
  lawyer_count?: number
  practice_areas?: string
}

export interface InternalTeamRegisterData extends BaseRegisterData {
  role: 'internal_team'
  department?: string
  employee_id?: string
}

export type RegisterData = BaseRegisterData | LawyerRegisterData | FirmRegisterData | InternalTeamRegisterData

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,

      // Login
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || 'Login failed')
          }

          const tokens: AuthTokens = await response.json()
          set({ tokens, isAuthenticated: true, isLoading: false })

          // Fetch user info
          await get().fetchUser()
          return true
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false 
          })
          return false
        }
      },

      // Register
      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null })
        
        try {
          // Determine endpoint based on role
          let endpoint = '/api/v1/auth/register'
          if (data.role === 'lawyer') {
            endpoint = '/api/v1/auth/register/lawyer'
          } else if (data.role === 'firm') {
            endpoint = '/api/v1/auth/register/firm'
          } else if (data.role === 'internal_team') {
            endpoint = '/api/v1/auth/register/internal'
          }

          const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.detail || 'Registration failed')
          }

          set({ isLoading: false })
          return { success: true, message: result.message }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Registration failed'
          set({ error: message, isLoading: false })
          return { success: false, message }
        }
      },

      // Logout
      logout: () => {
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          error: null,
        })
      },

      // Fetch current user
      fetchUser: async () => {
        const { tokens } = get()
        if (!tokens?.access_token) return

        try {
          const response = await fetch(`${API_URL}/api/v1/auth/me`, {
            headers: {
              'Authorization': `Bearer ${tokens.access_token}`,
            },
          })

          if (!response.ok) {
            if (response.status === 401) {
              // Try to refresh token
              const refreshed = await get().refreshToken()
              if (refreshed) {
                await get().fetchUser()
              }
              return
            }
            throw new Error('Failed to fetch user')
          }

          const user: User = await response.json()
          set({ user })
        } catch (error) {
          console.error('Failed to fetch user:', error)
        }
      },

      // Refresh access token
      refreshToken: async () => {
        const { tokens } = get()
        if (!tokens?.refresh_token) {
          get().logout()
          return false
        }

        try {
          const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: tokens.refresh_token }),
          })

          if (!response.ok) {
            get().logout()
            return false
          }

          const newTokens: AuthTokens = await response.json()
          set({ tokens: newTokens })
          return true
        } catch (error) {
          get().logout()
          return false
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
