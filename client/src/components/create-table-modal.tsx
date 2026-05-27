"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { Plus } from 'lucide-react'
import { useCreateTable } from '@/hooks/use-api'
import { toast } from 'sonner'

interface CreateTableModalProps {
  children: React.ReactNode
}

export function CreateTableModal({ children }: CreateTableModalProps) {
  const router = useRouter()
  const { createTable, loading: isLoading } = useCreateTable()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const newTable = await createTable({
        name: formData.name.trim(),
        description: formData.description.trim(),
      })
      if (newTable) {
        setOpen(false)
        router.push(`/table/${newTable.id}`)
        setFormData({ name: '', description: '' })
        toast.success('Table created successfully!')
      }
    } catch (error) {
      toast.error('Failed to create table. Please try again.')
    }
  }

  const handleInputChange = (field: 'name' | 'description', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const isFormValid = formData.name.trim().length > 0

  return (
    <>
      <div onClick={() => setOpen(true)} style={{ display: 'contents' }}>
        {children}
      </div>
      <Modal isOpen={open} onClose={() => setOpen(false)} maxWidth="sm">
        <Modal.Header onClose={() => setOpen(false)}>
          <Plus className="h-5 w-5" />
          <span className="font-semibold">Create New Retrospective</span>
        </Modal.Header>
        <Modal.Content className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Set up a new retrospective session for your team. You can customize the board later.
          </p>
          <form id="create-table-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Table Name *
              </label>
              <Input
                id="name"
                placeholder="e.g., Sprint 24 Retrospective"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                placeholder="Brief description of this retrospective session..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>
          </form>
        </Modal.Content>
        <Modal.Footer>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-table-form"
            disabled={!isFormValid || isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create Table
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
