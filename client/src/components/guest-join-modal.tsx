"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useGuestStore } from '@/stores/guest-store'
import { toast } from 'sonner'
import { User, LogIn, UserPlus, UserCheck } from 'lucide-react'
import { Modal } from '@/components/ui/modal'

interface GuestJoinModalProps {
  isOpen: boolean
  onClose: () => void
  tableName: string
  onJoin: (name: string) => Promise<void>
  inviteToken?: string
  tableId?: string
  isExistingGuest?: boolean
}

export function GuestJoinModal({ 
  isOpen, 
  onClose, 
  tableName, 
  onJoin, 
  inviteToken,
  tableId,
  isExistingGuest
}: GuestJoinModalProps) {
  const [name, setName] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const router = useRouter()

  const handleJoinAsGuest = async () => {
    if (!isExistingGuest && !name.trim()) {
      toast.error('Please enter your name')
      return
    }

    setIsJoining(true)
    try {
      await onJoin(name.trim())
      onClose()
    } catch (error) {
      console.error('Error joining as guest:', error)
      toast.error('Failed to join as guest')
    } finally {
      setIsJoining(false)
    }
  }

  const handleLogin = () => {
    // Redirect to login with invite token
    const params = new URLSearchParams()
    if (inviteToken) params.set('invite', inviteToken)
    if (tableId) params.set('tableId', tableId)
    
    router.push(`/auth/login?${params.toString()}`)
  }

  const handleRegister = () => {
    // Redirect to register with invite token
    const params = new URLSearchParams()
    if (inviteToken) params.set('invite', inviteToken)
    if (tableId) params.set('tableId', tableId)
    
    router.push(`/auth/register?${params.toString()}`)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Join Retrospective"
      description={
        isExistingGuest 
          ? `You're already participating as a guest. Join "${tableName}" with your existing session or create an account for full access.`
          : `You've been invited to join "${tableName}"`
      }
      maxWidth="md"
    >
      <Modal.Header onClose={onClose}>
        <UserCheck className="h-5 w-5" />
      </Modal.Header>
      
      <Modal.Content className="space-y-4">
        {/* Guest Join Option */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">
              {isExistingGuest ? 'Continue as Guest' : 'Join as Guest'}
            </Label>
          </div>
          {!isExistingGuest && (
            <div className="space-y-2">
              <Input
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isJoining}
              />
              <Button 
                onClick={handleJoinAsGuest} 
                disabled={!name.trim() || isJoining}
                className="w-full"
              >
                {isJoining ? 'Joining...' : 'Join as Guest'}
              </Button>
            </div>
          )}
          {isExistingGuest && (
            <div className="space-y-2">
              <Button 
                onClick={handleJoinAsGuest} 
                disabled={isJoining}
                className="w-full"
              >
                {isJoining ? 'Joining...' : 'Continue as Guest'}
              </Button>
              <p className="text-xs text-muted-foreground">
                You'll be linked to this table with your existing guest session.
              </p>
            </div>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        {/* Login/Register Options */}
        <div className="space-y-2">
          <Button 
            variant="outline" 
            onClick={handleLogin}
            className="w-full"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Login to Existing Account
          </Button>
          <Button 
            variant="outline" 
            onClick={handleRegister}
            className="w-full"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Create New Account
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          {isExistingGuest ? (
            <>
              <p>Creating an account will give you full access and the ability to create your own retrospectives.</p>
              <p>Your guest activity can be linked to your new account.</p>
            </>
          ) : (
            <>
              <p>Guest participants must post anonymously and have limited access.</p>
              <p>Creating an account gives you full access and the ability to create your own retrospectives.</p>
            </>
          )}
        </div>
      </Modal.Content>
    </Modal>
  )
} 