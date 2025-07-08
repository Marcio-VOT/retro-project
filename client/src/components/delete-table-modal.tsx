"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Trash2, AlertTriangle } from 'lucide-react'

interface DeleteTableModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  tableName: string
  isLoading: boolean
}

export function DeleteTableModal({
  isOpen,
  onClose,
  onConfirm,
  tableName,
  isLoading
}: DeleteTableModalProps) {
  const [confirmationText, setConfirmationText] = useState('')
  const isConfirmed = confirmationText === tableName

  const handleClose = () => {
    setConfirmationText('')
    onClose()
  }

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm()
      setConfirmationText('')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Delete Table"
      description={`Are you sure you want to delete "${tableName}"? This action cannot be undone.`}
      maxWidth="md"
    >
      <Modal.Header onClose={handleClose}>
        <Trash2 className="h-5 w-5" />
      </Modal.Header>
      
      <Modal.Content className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h4 className="font-medium text-destructive">Warning</h4>
            <p className="text-sm text-muted-foreground">
              This will permanently delete the table and all its data including:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>All cards and their votes</li>
              <li>All topics/categories</li>
              <li>All participant data</li>
              <li>All invite links</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label htmlFor="confirmation-input" className="text-sm font-medium">
            To confirm deletion, please type the table name: <span className="font-bold text-destructive">{tableName}</span>
          </label>
          <Input
            id="confirmation-input"
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="Enter table name to confirm"
            className={isConfirmed ? 'border-green-500 focus:border-green-500' : ''}
            disabled={isLoading}
          />
          {confirmationText && !isConfirmed && (
            <p className="text-sm text-destructive">
              The text must match the table name exactly
            </p>
          )}
          {isConfirmed && (
            <p className="text-sm text-green-600 font-medium">
              ✓ Confirmation successful
            </p>
          )}
        </div>
      </Modal.Content>
      
      <Modal.Footer>
        <Button variant="outline" onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          variant="destructive" 
          onClick={handleConfirm} 
          disabled={isLoading || !isConfirmed}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              Delete Table
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  )
} 