import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CardRowsView } from './card-rows-view'
import type { RetroCard, RetroTable } from '@/types'

vi.mock('./draggable-row-card', () => ({
  DraggableRowCard: ({ card }: { card: RetroCard }) => <div data-testid="draggable-row-card">{card.content}</div>,
}))

const cards: RetroCard[] = [
  { id: 'c1', content: 'Row 1', authorId: 'u1', authorType: 'user', authorName: 'Alice',
    categoryId: 'cat-1', votes: 0, isAnonymous: false, createdAt: '', isVotedByMe: false },
  { id: 'c2', content: 'Row 2', authorId: 'u1', authorType: 'user', authorName: 'Alice',
    categoryId: 'cat-1', votes: 0, isAnonymous: false, createdAt: '', isVotedByMe: false },
]

const table = {
  id: 't1', name: 'Board', description: '', createdAt: '', participantCount: 1,
  status: 'active' as const, cardsBlurred: false, participants: [], owner: 'u1',
  categories: { 'cat-1': { title: 'Went Well', color: 'bg-green-500' } },
} satisfies RetroTable

const defaults = {
  cards, table, onVote: vi.fn(), onDelete: vi.fn(),
  blurred: false, canDrag: true, canDelete: true, votingCardId: null,
}

describe('CardRowsView', () => {
  it('renders a row card for each card', () => {
    render(<CardRowsView {...defaults} />)
    expect(screen.getAllByTestId('draggable-row-card')).toHaveLength(2)
  })

  it('does not render column headers', () => {
    render(<CardRowsView {...defaults} />)
    expect(screen.queryByText('Went Well')).not.toBeInTheDocument()
  })
})
