// User types
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  created_at: string
  updated_at: string
}

// Team types
export interface Team {
  id: string
  name: string
  description?: string
  created_by: string
  created_at: string
  updated_at: string
  members: TeamMember[]
  retros: Retro[]
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: 'admin' | 'member'
  user: User
}

// Retro types
export interface Retro {
  id: string
  title: string
  description?: string
  team_id: string
  status: 'active' | 'completed' | 'archived'
  created_by: string
  created_at: string
  updated_at: string
  categories: RetroCategory[]
  team: Team
}

export interface RetroCategory {
  id: string
  retro_id: string
  name: string
  color: string
  order: number
  cards: RetroCard[]
}

export interface RetroCard {
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
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// WebSocket event types
export interface WebSocketEvent {
  type: string
  data: any
  room?: string
}

// Form types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface CreateTeamForm {
  name: string
  description?: string
}

export interface CreateRetroForm {
  title: string
  description?: string
  team_id: string
}

export interface CreateCardForm {
  content: string
  category_id: string
}

export interface RetroTable {
  id: string
  name: string
  description: string
  createdAt: string
  participantCount: number
  status: 'active' | 'archived'
  cardsBlurred: boolean
  participants: string[]
  owner: string
  categories: {
    [key: string]: { title: string; color: string }
  }
  isGuestTable?: boolean
}

export interface GuestUser {
  id: string
  name: string
  email?: string
  isGuest: true
  tempToken: string
  invitedTables: string[]
}

export interface InviteToken {
  token: string
  tableId: string
  expiresAt: string
  createdBy: string
}

export interface ShareInvite {
  email: string
  tableId: string
  message?: string
}

// New types for signed invites
export interface SignedInvite {
  token: string
  tableId: string
  email?: string
  expiresAt: string
  createdBy: string
  signature: string
}

export interface InviteValidation {
  valid: boolean
  tableId: string
  tableName: string
  email?: string
  expiresAt: string
  createdBy: string
}

export interface TableAccessRequest {
  tableId: string
  inviteToken?: string
  userToken?: string
  guestToken?: string
}

export interface TableAccessResponse {
  success: boolean
  table: RetroTable
  isOwner: boolean
  isParticipant: boolean
  accessGranted: boolean
} 