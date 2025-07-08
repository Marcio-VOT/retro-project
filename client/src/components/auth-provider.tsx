"use client"

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [isHydrated, setIsHydrated] = useState(false)
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    setIsHydrated(true)
    checkAuth()
  }, [checkAuth])

  if (!isHydrated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <>{children}</>
} 