"use client"

import { Badge } from '@/components/ui/badge'
import { getColorFromClass } from '@/lib/color-utils'
import { DraggableCard } from './draggable-card'
import type { RetroCard, RetroTable } from '@/types'

interface CardGridViewProps {
  categories: RetroTable['categories']
  cards: RetroCard[]
  table: RetroTable
  onVote: (cardId: string) => void
  onDelete: (cardId: string) => void
  blurred: boolean
  canDrag: boolean
  canDelete: boolean
}

export function CardGridView({ categories, cards, table, onVote, onDelete, blurred, canDrag, canDelete }: CardGridViewProps) {
  if (cards.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Object.entries(categories).map(([categoryKey, category]) => {
        const categoryCards = cards.filter(card => card.categoryId === categoryKey)
        return (
          <div key={categoryKey} className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getColorFromClass(category.color) }}
              />
              <h3 className="font-semibold">{category.title}</h3>
              <Badge variant="secondary">{categoryCards.length}</Badge>
            </div>
            <div className="space-y-3">
              {categoryCards.map((card) => (
                <DraggableCard
                  key={card.id}
                  card={card}
                  table={table}
                  onVote={onVote}
                  onDelete={onDelete}
                  blurred={blurred}
                  canDrag={canDrag}
                  canDelete={canDelete}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
