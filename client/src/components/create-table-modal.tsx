"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const newTable = await createTable({
        name: formData.name.trim(),
        description: formData.description.trim()
      })
      
      if (newTable) {
        // Close modal and navigate to the new table
        setOpen(false)
        router.push(`/table/${newTable.id}`)
        
        // Reset form
        setFormData({ name: '', description: '' })
        
        toast.success('Table created successfully!')
      }
    } catch (error) {
      console.error('Error creating table:', error)
      toast.error('Failed to create table. Please try again.')
    }
  }

  const handleInputChange = (field: 'name' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const isFormValid = formData.name.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Retrospective
          </DialogTitle>
          <DialogDescription>
            Set up a new retrospective session for your team. You can customize the board later.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 