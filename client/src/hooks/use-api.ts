import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { useGuestStore } from '@/stores/guest-store'
import { SignedInvite, InviteValidation, TableAccessRequest, TableAccessResponse, RetroTable } from '@/types'

interface ApiResponse<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>() {
  const [state, setState] = useState<ApiResponse<T>>({
    data: null,
    loading: false,
    error: null
  })
  const { token } = useAuthStore()
  const { guestUser } = useGuestStore()

  const execute = useCallback(async (
    url: string, 
    options?: RequestInit
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // Add authentication header
      if (token) {
        headers.Authorization = `Bearer ${token}`
      } else if (guestUser?.tempToken) {
        headers.Authorization = `Bearer guest:${guestUser.tempToken}`
      }

      // Merge with any additional headers from options
      if (options?.headers) {
        Object.assign(headers, options.headers)
      }
      
      const response = await fetch(url, {
        headers,
        ...options
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setState({ data, loading: false, error: null })
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState({ data: null, loading: false, error: errorMessage })
      toast.error(errorMessage)
      return null
    }
  }, [token, guestUser])

  return { ...state, execute }
}

// Specific API hooks for your retro app
export function useGetUserTables() {
  const { loading, error, execute } = useApi<{
    id: string
    name: string
    description: string
    createdAt: string
    participantCount: number
    status: 'active' | 'archived'
  }[]>()
  
  const getUserTables = useCallback(async () => {
    return execute('/api/tables')
  }, [execute])
  
  return { getUserTables, loading, error }
}

export function useCreateTable() {
  const { loading, error, execute } = useApi<RetroTable>()
  
  const createTable = useCallback(async (tableData: { name: string; description?: string }) => {
    return execute('/api/tables', {
      method: 'POST',
      body: JSON.stringify(tableData)
    })
  }, [execute])
  
  return { createTable, loading, error }
}

export function useVoteCard() {
  const { loading, error, execute } = useApi<{ success: boolean }>()
  
  const voteCard = useCallback(async (cardId: string, action: 'vote' | 'unvote') => {
    return execute(`/api/cards/${cardId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ action })
    })
  }, [execute])
  
  return { voteCard, loading, error }
}

export function useMergeCards() {
  const { loading, error, execute } = useApi<{ success: boolean; mergedCard: any }>()
  
  const mergeCards = useCallback(async (draggedCardId: string, targetCardId: string) => {
    return execute('/api/cards/merge', {
      method: 'POST',
      body: JSON.stringify({ draggedCardId, targetCardId })
    })
  }, [execute])
  
  return { mergeCards, loading, error }
}

export function useDeleteCard() {
  const { loading, error, execute } = useApi<{ success: boolean }>()
  
  const deleteCard = useCallback(async (cardId: string) => {
    return execute(`/api/cards/${cardId}`, {
      method: 'DELETE'
    })
  }, [execute])
  
  return { deleteCard, loading, error }
}

export function useAddCard() {
  const { loading, error, execute } = useApi<{ id: string; content: string; authorId?: string; authorType: string; authorName: string; categoryId: string; votes: number; isAnonymous: boolean; createdAt: string; isVotedByMe: boolean }>()
  
  const addCard = useCallback(async (cardData: { content: string; categoryId: string; isAnonymous: boolean }) => {
    return execute('/api/cards', {
      method: 'POST',
      body: JSON.stringify(cardData)
    })
  }, [execute])
  
  return { addCard, loading, error }
}

export function useGetTable() {
  const { loading, error, execute } = useApi<{ id: string; name: string; description: string; status: 'active' | 'archived'; participants: string[]; owner: string; categories: Record<string, { title: string; color: string }> }>()
  
  const getTable = useCallback(async (tableId: string) => {
    return execute(`/api/tables/${tableId}`)
  }, [execute])
  
  return { getTable, loading, error }
}

export function useArchiveTable() {
  const { loading, error, execute } = useApi<{ success: boolean }>()
  
  const archiveTable = useCallback(async (tableId: string) => {
    return execute(`/api/tables/${tableId}/archive`, {
      method: 'POST',
      body: JSON.stringify({ status: 'archived' })
    })
  }, [execute])
  
  return { archiveTable, loading, error }
}

// Guest and sharing API hooks
export function useShareTable() {
  const { loading, error, execute } = useApi<{ success: boolean; inviteToken?: string; signedInvite?: SignedInvite }>()
  
  const shareTable = useCallback(async (tableId: string, email: string, message?: string) => {
    return execute(`/api/tables/${tableId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email, expiresIn: 24 })
    })
  }, [execute])
  
  return { shareTable, loading, error }
}

export function useJoinAsGuest() {
  const { loading, error, execute } = useApi<{ success: boolean; guestUser: { id: string; name: string; tempToken: string } }>()
  
  const joinAsGuest = useCallback(async (tableId: string, name: string, inviteToken?: string) => {
    // Build query parameters
    const params = new URLSearchParams()
    if (inviteToken) params.append('inviteToken', inviteToken)
    
    const queryString = params.toString()
    const url = queryString ? `/api/tables/${tableId}/join-guest?${queryString}` : `/api/tables/${tableId}/join-guest`
    
    return execute(url, {
      method: 'POST',
      body: JSON.stringify({ name })
    })
  }, [execute])
  
  return { joinAsGuest, loading, error }
}

export function useLinkGuestToAccount() {
  const { loading, error, execute } = useApi<{ success: boolean }>()
  
  const linkGuestToAccount = useCallback(async (userId: string, guestToken: string) => {
    return execute('/api/auth/link-guest', {
      method: 'POST',
      body: JSON.stringify({ userId, guestToken })
    })
  }, [execute])
  
  return { linkGuestToAccount, loading, error }
}

export function useValidateInviteToken() {
  const { loading, error, execute } = useApi<InviteValidation>()
  
  const validateToken = useCallback(async (token: string) => {
    return execute(`/api/invites/validate/${token}`)
  }, [execute])
  
  return { validateToken, loading, error }
}

// New signed invite API hooks
export function useCreateSignedInvite() {
  const { loading, error, execute } = useApi<{ success: boolean; signedInvite: SignedInvite }>()
  
  const createSignedInvite = useCallback(async (tableId: string, email?: string, expiresIn?: number) => {
    return execute(`/api/tables/${tableId}/signed-invite`, {
      method: 'POST',
      body: JSON.stringify({ email, expiresIn })
    })
  }, [execute])
  
  return { createSignedInvite, loading, error }
}

export function useValidateSignedInvite() {
  const { loading, error, execute } = useApi<InviteValidation>()
  
  const validateSignedInvite = useCallback(async (token: string) => {
    return execute(`/api/invites/validate/${token}`)
  }, [execute])
  
  return { validateSignedInvite, loading, error }
}

export function useGetTableWithAccess() {
  const { loading, error, execute } = useApi<TableAccessResponse>()
  const { token } = useAuthStore()
  const { guestUser } = useGuestStore()
  
  const getTableWithAccess = useCallback(async (tableId: string, inviteToken?: string) => {
    // Build query parameters
    const params = new URLSearchParams()
    if (inviteToken) params.append('inviteToken', inviteToken)
    // Note: token and guestUser.tempToken are handled by the Authorization header in useApi
    
    const queryString = params.toString()
    const url = queryString ? `/api/tables/${tableId}/access?${queryString}` : `/api/tables/${tableId}/access`
    
    return execute(url, {
      method: 'GET'
    })
  }, [execute, token, guestUser])
  
  return { getTableWithAccess, loading, error }
}

// New hook for getting cards
export function useGetCards() {
  const { loading, error, execute } = useApi<Record<string, {
    id: string
    content: string
    authorId?: string
    authorType: string
    authorName: string
    categoryId: string
    votes: number
    isAnonymous: boolean
    createdAt: string
    isVotedByMe: boolean
  }[]>>()
  
  const getCards = useCallback(async (tableId: string) => {
    return execute(`/api/tables/${tableId}/cards`)
  }, [execute])
  
  return { getCards, loading, error }
}

// Topic management API hooks
export function useCreateTopic() {
  const { loading, error, execute } = useApi<{
    id: string
    title: string
    color: string
    order: number
  }>()
  
  const createTopic = useCallback(async (tableId: string, topicData: { title: string; color: string }) => {
    return execute(`/api/tables/${tableId}/topics`, {
      method: 'POST',
      body: JSON.stringify(topicData)
    })
  }, [execute])
  
  return { createTopic, loading, error }
}

export function useUpdateTopic() {
  const { loading, error, execute } = useApi<{
    id: string
    title: string
    color: string
    order: number
  }>()
  
  const updateTopic = useCallback(async (tableId: string, topicId: string, topicData: { title: string; color: string }) => {
    return execute(`/api/tables/${tableId}/topics/${topicId}`, {
      method: 'PUT',
      body: JSON.stringify(topicData)
    })
  }, [execute])
  
  return { updateTopic, loading, error }
}

export function useRemoveTopic() {
  const { loading, error, execute } = useApi<{ success: boolean; message: string }>()
  
  const removeTopic = useCallback(async (tableId: string, topicId: string) => {
    return execute(`/api/tables/${tableId}/topics/${topicId}`, {
      method: 'DELETE'
    })
  }, [execute])
  
  return { removeTopic, loading, error }
}

export function useDeleteTable() {
  const { loading, error, execute } = useApi<{ success: boolean; message: string }>()

  const deleteTable = useCallback(async (tableId: string) => {
    return execute(`/api/tables/${tableId}`, {
      method: 'DELETE'
    })
  }, [execute])

  return { deleteTable, loading, error }
}

export function useToggleBlur() {
  const { loading, error, execute } = useApi<{ success: boolean; blurred: boolean }>()

  const toggleBlur = useCallback(async (tableId: string) => {
    return execute(`/api/tables/${tableId}/cards/blur`, {
      method: 'PATCH'
    })
  }, [execute])

  return { toggleBlur, loading, error }
} 