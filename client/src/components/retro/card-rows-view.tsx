"use client"

import { DraggableRowCard } from './draggable-row-card'
import type { RetroCard, RetroTable } from '@/types'

interface CardRowsViewProps {
  cards: RetroCard[]
  table: RetroTable
  onVote: (cardId: string) => void
  onDelete: (cardId: string) => void
  blurred: boolean
  canDrag: boolean
  canDelete: boolean
  votingCardId: string | null
}

export function CardRowsView({ cards, table, onVote, onDelete, blurred, canDrag, canDelete, votingCardId }: CardRowsViewProps) {
  return (
    <div className="space-y-3">
      {cards.map((card) => (
        <DraggableRowCard
          key={card.id}
          card={card}
          table={table}
          onVote={onVote}
          onDelete={onDelete}
          blurred={blurred}
          canDrag={canDrag}
          canDelete={canDelete}
          votingCardId={votingCardId}
        />
      ))}
    </div>
  )
}
