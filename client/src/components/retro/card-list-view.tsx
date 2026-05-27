"use client"

import { DraggableCard } from './draggable-card'
import type { RetroCard, RetroTable } from '@/types'

interface CardListViewProps {
  cards: RetroCard[]
  table: RetroTable
  onVote: (cardId: string) => void
  onDelete: (cardId: string) => void
  blurred: boolean
  canDrag: boolean
  canDelete: boolean
}

export function CardListView({ cards, table, onVote, onDelete, blurred, canDrag, canDelete }: CardListViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
      {cards.map((card) => (
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
  )
}
