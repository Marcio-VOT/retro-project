"use client"

import { ThumbsUp, Trash2, GripVertical } from 'lucide-react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { getColorFromClass } from '@/lib/color-utils'
import type { RetroCard, RetroTable } from '@/types'
import type { DraggableCardProps } from './draggable-card'

export interface DraggableRowCardProps extends DraggableCardProps {
  votingCardId: string | null
}

export function DraggableRowCard({ card, table, onVote, onDelete, blurred, canDrag, canDelete, votingCardId }: DraggableRowCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setDragNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: card.id, disabled: !canDrag })

  const {
    setNodeRef: setDropNodeRef,
    isOver,
  } = useDroppable({ id: `drop-${card.id}` })

  const setNodeRef = (node: HTMLElement | null) => {
    setDragNodeRef(node)
    setDropNodeRef(node)
  }

  const style = {
    transform: isDragging ? CSS.Transform.toString(transform) : undefined,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex items-start gap-3 p-4 bg-card border rounded-lg hover:shadow-md ${canDrag ? 'cursor-move' : 'cursor-default'} ${isOver ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''} ${isDragging ? '' : 'transition-all duration-200'}`}
      style={{
        ...style,
        touchAction: canDrag ? 'none' : 'auto',
        userSelect: isDragging ? 'none' : 'auto',
        WebkitUserSelect: isDragging ? 'none' : 'auto',
      }}
      data-draggable={canDrag}
      data-dragging={isDragging}
      {...(canDrag ? { ...attributes, ...listeners } : {})}
    >
      <div className="flex-shrink-0 flex items-center gap-1">
        {canDrag && (
          <div
            className="p-1 rounded hover:bg-accent transition-colors cursor-move"
            title="Drag to merge"
            style={{ touchAction: 'none' }}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
          style={{ backgroundColor: getColorFromClass(table.categories?.[card.categoryId]?.color || '#6B7280') }}
        >
          {table.categories?.[card.categoryId]?.title?.charAt(0) || '?'}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className={`text-sm break-words ${blurred ? 'blur-sm select-none' : ''}`}>
            {card.content}
          </p>
          <div className="flex items-center gap-1 flex-shrink-0">
            {table.status === 'active' && (
              <button
                onClick={(e) => { e.stopPropagation(); onVote(card.id) }}
                disabled={votingCardId === card.id}
                className="p-1 hover:bg-accent rounded text-xs flex items-center gap-1"
                title="Vote"
                style={{ touchAction: 'manipulation' }}
              >
                <ThumbsUp className="h-3 w-3" />
                {card.votes}
              </button>
            )}
            {canDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(card.id) }}
                className="p-1 hover:bg-destructive/10 text-destructive rounded text-xs"
                title="Delete card"
                style={{ touchAction: 'manipulation' }}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>by {card.isAnonymous ? 'Anonymous' : card.authorName}</span>
          <span>{new Date(card.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}
