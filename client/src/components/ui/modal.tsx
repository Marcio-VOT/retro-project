"use client"

import { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useEscKey } from '@/hooks/use-esc-key'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  showCloseButton?: boolean
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

interface ModalHeaderProps {
  title?: string
  description?: string
  onClose?: () => void
  showCloseButton?: boolean
  children?: ReactNode
}

interface ModalContentProps {
  children: ReactNode
  className?: string
}

interface ModalFooterProps {
  children: ReactNode
  className?: string
}

function ModalHeader({ title, description, onClose, showCloseButton = true, children }: ModalHeaderProps) {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {children}
          {title && <CardTitle>{title}</CardTitle>}
        </div>
        {showCloseButton && onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
  )
}

function ModalContent({ children, className }: ModalContentProps) {
  return (
    <CardContent className={className}>
      {children}
    </CardContent>
  )
}

function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <CardContent className={`flex justify-end gap-2 pt-0 ${className || ''}`}>
      {children}
    </CardContent>
  )
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  children, 
  showCloseButton = true,
  className = '',
  maxWidth = 'md'
}: ModalProps) {
  // Add ESC key functionality
  useEscKey(onClose, isOpen)

  if (!isOpen) return null

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      <Card className={`relative w-full bg-background border shadow-lg ${maxWidthClasses[maxWidth]} ${className}`}>
        {children}
      </Card>
    </div>
  )
}

// Export sub-components for composable pattern
Modal.Header = ModalHeader
Modal.Content = ModalContent
Modal.Footer = ModalFooter 