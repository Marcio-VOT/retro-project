import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GuestUser, InviteToken, SignedInvite } from '@/types'

interface GuestState {
  guestUser: GuestUser | null
  inviteTokens: InviteToken[]
  signedInvites: SignedInvite[]
  isGuest: boolean
  joinAsGuest: (tableId: string, name: string, inviteToken?: string) => Promise<GuestUser>
  setGuestUser: (guestUser: GuestUser) => void
  linkGuestToTable: (tableId: string, inviteToken: string) => Promise<void>
  addInviteToken: (token: InviteToken) => void
  addSignedInvite: (invite: SignedInvite) => void
  removeInviteToken: (token: string) => void
  removeSignedInvite: (token: string) => void
  linkGuestToAccount: (userId: string) => Promise<void>
  clearGuestData: () => void
  hasAccessToTable: (tableId: string) => boolean
}

export const useGuestStore = create<GuestState>()(
  persist(
    (set, get) => ({
      guestUser: null,
      inviteTokens: [],
      signedInvites: [],
      isGuest: false,

      joinAsGuest: async (tableId: string, name: string, inviteToken?: string): Promise<GuestUser> => {
        // This will be handled by the API hook in the component
        // The store just manages the state
        const tempToken = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        const guestUser: GuestUser = {
          id: `guest_${Date.now()}`,
          name,
          isGuest: true,
          tempToken,
          invitedTables: [tableId]
        }

        set({ 
          guestUser, 
          isGuest: true 
        })

        return guestUser
      },

      setGuestUser: (guestUser: GuestUser) => {
        set({ guestUser, isGuest: true })
      },

      linkGuestToTable: async (tableId: string, inviteToken: string) => {
        const { guestUser } = get()
        if (!guestUser) return

        // Add the new table to the guest's invited tables
        const updatedGuestUser: GuestUser = {
          ...guestUser,
          invitedTables: [...guestUser.invitedTables, tableId]
        }

        set({ guestUser: updatedGuestUser })
      },

      addInviteToken: (token: InviteToken) => {
        set(state => ({
          inviteTokens: [...state.inviteTokens.filter(t => t.token !== token.token), token]
        }))
      },

      addSignedInvite: (invite: SignedInvite) => {
        set(state => ({
          signedInvites: [...state.signedInvites.filter(i => i.token !== invite.token), invite]
        }))
      },

      removeInviteToken: (token: string) => {
        set(state => ({
          inviteTokens: state.inviteTokens.filter(t => t.token !== token)
        }))
      },

      removeSignedInvite: (token: string) => {
        set(state => ({
          signedInvites: state.signedInvites.filter(i => i.token !== token)
        }))
      },

      linkGuestToAccount: async (userId: string) => {
        const { guestUser } = get()
        if (!guestUser) return

        // This will be handled by the API hook
        set({ 
          guestUser: null, 
          isGuest: false,
          inviteTokens: [],
          signedInvites: []
        })
      },

      clearGuestData: () => {
        set({ 
          guestUser: null, 
          isGuest: false,
          inviteTokens: [],
          signedInvites: []
        })
      },

      hasAccessToTable: (tableId: string) => {
        const { guestUser, signedInvites } = get()
        
        if (!guestUser) return false
        
        // Check if guest has been invited to this table
        return guestUser.invitedTables.includes(tableId) || 
               signedInvites.some(invite => invite.tableId === tableId)
      }
    }),
    {
      name: 'guest-storage',
      partialize: (state) => ({ 
        guestUser: state.guestUser, 
        inviteTokens: state.inviteTokens,
        signedInvites: state.signedInvites,
        isGuest: state.isGuest
      })
    }
  )
) 