import { SignedInvite, InviteValidation } from '@/types'

/**
 * Extract invite token from URL
 */
export function getInviteTokenFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('invite')
}

/**
 * Generate secure invite URL
 */
export function generateInviteUrl(tableId: string, inviteToken: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  return `${baseUrl}/table/${tableId}?invite=${inviteToken}`
}

/**
 * Validate invite token format (basic validation)
 */
export function isValidInviteToken(token: string): boolean {
  // Basic validation - token should be a non-empty string
  return typeof token === 'string' && token.length > 0
}

/**
 * Check if invite is expired
 */
export function isInviteExpired(invite: SignedInvite | InviteValidation): boolean {
  if (!invite.expiresAt) return false
  
  const expiryDate = new Date(invite.expiresAt)
  const now = new Date()
  
  return now > expiryDate
}

/**
 * Format invite expiry date for display
 */
export function formatInviteExpiry(expiresAt: string): string {
  const expiryDate = new Date(expiresAt)
  const now = new Date()
  const diffInDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays <= 0) {
    return 'Expired'
  } else if (diffInDays === 1) {
    return 'Expires tomorrow'
  } else if (diffInDays < 7) {
    return `Expires in ${diffInDays} days`
  } else {
    return `Expires ${expiryDate.toLocaleDateString()}`
  }
}

/**
 * Create table access request payload
 */
export function createTableAccessRequest(
  tableId: string, 
  inviteToken?: string, 
  userToken?: string, 
  guestToken?: string
) {
  return {
    tableId,
    inviteToken,
    userToken,
    guestToken
  }
} 