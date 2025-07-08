"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Share2, Copy, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateSignedInvite } from '@/hooks/use-api'
import { Modal } from '@/components/ui/modal'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  tableId: string
  tableName: string
  onShare: (email: string, message?: string) => Promise<void>
}

export function ShareModal({ isOpen, onClose, tableId, tableName, onShare }: ShareModalProps) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [signedInvite, setSignedInvite] = useState<any>(null)
  const { createSignedInvite, loading: isCreatingInvite } = useCreateSignedInvite()

  const handleShare = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address')
      return
    }

    setIsSharing(true)
    try {
      await onShare(email.trim(), message.trim() || undefined)
      setEmail('')
      setMessage('')
      toast.success('Invitation sent successfully!')
    } catch (error) {
      toast.error('Failed to send invitation. Please try again.')
    } finally {
      setIsSharing(false)
    }
  }

  const generateSignedInviteLink = async () => {
    try {
      const result = await createSignedInvite(tableId, undefined, 7 * 24 * 60 * 60 * 1000)
      
      if (result) {
        const baseUrl = window.location.origin
        const link = `${baseUrl}/table/${tableId}?invite=${result.signedInvite.token}`
        setInviteLink(link)
        setSignedInvite(result.signedInvite)
        toast.success('Secure invite link generated!')
      }
    } catch (error) {
      toast.error('Failed to generate invite link')
    }
  }

  const copyInviteLink = async () => {
    if (!inviteLink) {
      await generateSignedInviteLink()
      return
    }

    try {
      await navigator.clipboard.writeText(inviteLink)
      toast.success('Invite link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Table"
      description={`Invite people to join "${tableName}" retrospective`}
      maxWidth="md"
    >
      <Modal.Header onClose={onClose}>
        <Share2 className="h-5 w-5" />
      </Modal.Header>
      
      <Modal.Content className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email Address *
          </label>
          <Input
            id="email"
            type="email"
            placeholder="colleague@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="message" className="text-sm font-medium">
            Personal Message (Optional)
          </label>
          <Textarea
            id="message"
            placeholder="Hey! I'd love for you to join our retrospective session..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Secure Invite Link
          </label>
          <div className="p-3 bg-muted/50 rounded-lg border">
            <p className="text-xs text-muted-foreground mb-2">
              Generate a secure, signed invite link that expires in 7 days. Only people with this link can access the table.
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              value={inviteLink}
              placeholder="Click 'Generate Link' to create secure invite link"
              readOnly
            />
            <Button
              variant="outline"
              size="sm"
              onClick={copyInviteLink}
              disabled={isCreatingInvite}
              className="flex items-center gap-2"
            >
              {isCreatingInvite ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {inviteLink ? 'Copy' : 'Generate'}
            </Button>
          </div>
          {signedInvite && (
            <div className="text-xs text-muted-foreground">
              Expires: {new Date(signedInvite.expiresAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </Modal.Content>
      
      <Modal.Footer>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleShare} 
          disabled={isSharing || !email.trim()}
          className="flex items-center gap-2"
        >
          {isSharing ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Sending...
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4" />
              Send Invitation
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  )
} 