"use client"

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ThumbsUp, Trash2, GripVertical, EyeOff } from 'lucide-react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { getColorFromClass } from '@/lib/color-utils'
import type { RetroCard, RetroTable } from '@/types'

export interface DraggableCardProps {
  card: RetroCard
  table: RetroTable
  onVote: (cardId: string) => void
  onDelete: (cardId: string) => void
  blurred: boolean
  canDrag: boolean
  canDelete: boolean
}

export function DraggableCard({ card, table, onVote, onDelete, blurred, canDrag, canDelete }: DraggableCardProps) {
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

  const hasMergedContent = card.content.includes('\n\n---\n\n')
  const contentParts = hasMergedContent ? card.content.split('\n\n---\n\n') : [card.content]

  const categoryColor = table.categories?.[card.categoryId]?.color
  const badgeColor = categoryColor ? getColorFromClass(categoryColor) : '#6B7280'

  return (
    <Card
      ref={setNodeRef}
      className={`hover:shadow-md ${canDrag ? 'cursor-move' : 'cursor-default'} ${isDragging ? 'z-50' : ''} ${isOver ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''} min-h-[200px] flex flex-col ${isDragging ? '' : 'transition-all duration-200'}`}
      {...(canDrag ? { ...attributes, ...listeners } : {})}
      style={{
        ...style,
        touchAction: canDrag ? 'none' : 'auto',
        userSelect: isDragging ? 'none' : 'auto',
        WebkitUserSelect: isDragging ? 'none' : 'auto',
      }}
      data-draggable={canDrag}
      data-dragging={isDragging}
    >
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              style={{ backgroundColor: badgeColor, color: 'white', borderColor: badgeColor }}
            >
              {table.categories?.[card.categoryId]?.title || card.categoryId}
            </Badge>
            {card.isAnonymous && table.status === 'active' && <EyeOff className="h-4 w-4 text-muted-foreground" />}
            {canDrag && (
              <div title="Drag to reorder" className="p-1 rounded hover:bg-accent transition-colors" style={{ touchAction: 'none' }}>
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              title="Vote"
              onClick={(e) => { e.stopPropagation(); onVote(card.id) }}
              className={`h-8 w-8 p-0 ${card.isVotedByMe ? 'text-primary' : ''}`}
              style={{ touchAction: 'manipulation' }}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[20px]">{card.votes}</span>
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                title="Delete card"
                onClick={(e) => { e.stopPropagation(); onDelete(card.id) }}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                style={{ touchAction: 'manipulation' }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className={`space-y-3 flex-1 ${blurred ? 'blur-sm select-none' : ''}`}>
          {contentParts.map((part, index) => (
            <div key={index} className="flex-1">
              <p className="text-sm leading-relaxed break-words overflow-wrap-anywhere hyphens-auto">{part}</p>
              {index < contentParts.length - 1 && (
                <div className="w-full h-px bg-border my-3" />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 flex-shrink-0">
          <span>{card.isAnonymous ? 'Anonymous' : card.authorName}</span>
          <span>{new Date(card.createdAt).toLocaleTimeString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}
