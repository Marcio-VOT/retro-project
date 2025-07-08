"use client"

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { ColorPicker } from '@/components/ui/color-picker'
import { Plus } from 'lucide-react'

interface TopicManagerModalProps {
  isOpen: boolean
  onClose: () => void
  newTopic: { title: string; color: string }
  onNewTopicChange: (topic: { title: string; color: string }) => void
  onAddTopic: () => void
  isTopicFormValid: boolean
  isTopicNameDuplicate: boolean
}

export function TopicManagerModal({
  isOpen,
  onClose,
  newTopic,
  onNewTopicChange,
  onAddTopic,
  isTopicFormValid,
  isTopicNameDuplicate
}: TopicManagerModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Topic"
      description="Create a new category for organizing your retrospective cards"
      maxWidth="md"
    >
      <Modal.Header onClose={onClose}>
        <Plus className="h-5 w-5" />
      </Modal.Header>
      
      <Modal.Content className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="topic-title" className="text-sm font-medium">
            Topic Name *
          </label>
          <Input
            id="topic-title"
            placeholder="e.g., Technical Debt"
            value={newTopic.title}
            onChange={(e) => onNewTopicChange({ ...newTopic, title: e.target.value })}
            className={isTopicNameDuplicate ? "border-red-500 focus:border-red-500" : ""}
          />
          {isTopicNameDuplicate && (
            <p className="text-sm text-red-500">
              A topic with this name already exists. Please choose a different name.
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Color Theme</label>
          <ColorPicker
            value={newTopic.color}
            onChange={(color) => onNewTopicChange({ ...newTopic, color })}
          />
        </div>
      </Modal.Content>
      
      <Modal.Footer>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onAddTopic} disabled={!isTopicFormValid}>
          Add Topic
        </Button>
      </Modal.Footer>
    </Modal>
  )
} 