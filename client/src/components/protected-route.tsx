"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useGuestStore } from '@/stores/guest-store'
import { useValidateSignedInvite, useJoinAsGuest } from '@/hooks/use-api'
import { toast } from 'sonner'
import { GuestJoinModal } from '@/components/guest-join-modal'

interface ProtectedRouteProps {
  children: React.ReactNode
}

// Custom hook for authentication flow
function useAuthFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()
  const { isGuest, guestUser, joinAsGuest: joinAsGuestStore, linkGuestToTable, clearGuestData, setGuestUser } = useGuestStore()
  const { validateSignedInvite } = useValidateSignedInvite()
  const { joinAsGuest: joinAsGuestApi } = useJoinAsGuest()
  
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'guest' | 'invite' | 'unauthorized'>('loading')
  const [inviteData, setInviteData] = useState<{ token: string; tableId: string; tableName: string } | null>(null)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [showGuestModal, setShowGuestModal] = useState(false)

  const inviteToken = searchParams.get('invite')

  useEffect(() => {
    if (isLoading) {
      setAuthState('loading')
      setLoadingMessage("Checking authentication...")
      return
    }

    const determineAuthState = async () => {
      try {
        // 1. Authenticated users get immediate access
        if (isAuthenticated) {
          setAuthState('authenticated')
          return
        }

        // 2. Existing guests without invite token get access
        if (isGuest && guestUser && !inviteToken) {
          setAuthState('guest')
          return
        }

        // 3. Handle invite token scenarios
        if (inviteToken) {
          setLoadingMessage("Validating invite...")
          
          try {
            const validation = await validateSignedInvite(inviteToken)
            
            if (validation?.valid) {
              const data = {
                token: inviteToken,
                tableId: validation.tableId,
                tableName: validation.tableName
              }
              setInviteData(data)
              setShowGuestModal(true)
              setAuthState('invite')
            } else {
              toast.error('Invalid or expired invite link')
              setAuthState('unauthorized')
            }
          } catch (error) {
            console.error('Error validating invite:', error)
            toast.error('Invalid invite link')
            setAuthState('unauthorized')
          }
          return
        }

        // 4. No authentication, no guest token, no invite = unauthorized
        setAuthState('unauthorized')
        
      } catch (error) {
        console.error('Error in auth flow:', error)
        setAuthState('unauthorized')
      }
    }

    determineAuthState()
  }, [isLoading, isAuthenticated, isGuest, guestUser, inviteToken, validateSignedInvite])

  const handleGuestJoin = async (name: string) => {
    if (!inviteData) return
    
    try {
      if (isGuest && guestUser) {
        // Existing guest - link to new table
        await linkGuestToTable(inviteData.tableId, inviteData.token)
      } else {
        // New guest - create new guest user
        const result = await joinAsGuestApi(inviteData.tableId, name, inviteData.token)
        if (result && result.guestUser) {
          // Create a proper guest user object with the real data from the API
          const realGuestUser = {
            id: result.guestUser.id,
            name: result.guestUser.name,
            isGuest: true as const,
            tempToken: result.guestUser.tempToken,
            invitedTables: [inviteData.tableId]
          }
          
          // Update the store with the real guest user data
          setGuestUser(realGuestUser)
        }
      }
      
      // Update the URL to remove the invite token
      const url = new URL(window.location.href)
      url.searchParams.delete('invite')
      window.history.replaceState({}, '', url.toString())
      
      setShowGuestModal(false)
      setInviteData(null)
      setAuthState('guest')
      
      if (isGuest && guestUser) {
        toast.success('Linked to new table! You can now participate.')
      } else {
        toast.success('Welcome! You can now participate in the retrospective.')
      }
    } catch (error) {
      console.error('Error joining as guest:', error)
      toast.error('Failed to join as guest')
    }
  }

  const handleCloseGuestModal = () => {
    setShowGuestModal(false)
    setInviteData(null)
    // Redirect to home if they close the modal
    router.push('/home')
  }

  return {
    authState,
    loadingMessage,
    showGuestModal,
    inviteData,
    handleGuestJoin,
    handleCloseGuestModal
  }
}

export function ProtectedRoute({ children }: ProtectedRouteProps): JSX.Element | null {
  const router = useRouter()
  const { isGuest, guestUser } = useGuestStore()
  const { authState, loadingMessage, showGuestModal, inviteData, handleGuestJoin, handleCloseGuestModal } = useAuthFlow()

  // Show loading state
  if (authState === 'loading') {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        {loadingMessage && (
          <p className="text-sm text-muted-foreground">{loadingMessage}</p>
        )}
      </div>
    )
  }

  // Redirect unauthorized users
  if (authState === 'unauthorized') {
    router.push('/auth/login')
    return null
  }

  // Allow access for authenticated users and guests
  if (authState === 'authenticated' || authState === 'guest') {
    return <>{children}</>
  }

  // Show guest modal for invite scenarios
  if (authState === 'invite') {
    return (
      <>
        {children}
        
        <GuestJoinModal
          isOpen={showGuestModal}
          onClose={handleCloseGuestModal}
          tableName={inviteData?.tableName || 'Retrospective'}
          onJoin={handleGuestJoin}
          inviteToken={inviteData?.token}
          tableId={inviteData?.tableId}
          isExistingGuest={isGuest && guestUser !== null}
        />
      </>
    )
  }

  // Fallback
  return null
} 