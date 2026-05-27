import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CardListView } from './card-list-view'
import type { RetroCard, RetroTable } from '@/types'

vi.mock('./draggable-card', () => ({
  DraggableCard: ({ card }: { card: RetroCard }) => <div data-testid="draggable-card">{card.content}</div>,
}))

const cards: RetroCard[] = [
  { id: 'c1', content: 'List 1', authorId: 'u1', authorType: 'user', authorName: 'Alice',
    categoryId: 'cat-1', votes: 0, isAnonymous: false, createdAt: '', isVotedByMe: false },
  { id: 'c2', content: 'List 2', authorId: 'u1', authorType: 'user', authorName: 'Alice',
    categoryId: 'cat-1', votes: 0, isAnonymous: false, createdAt: '', isVotedByMe: false },
]

const table = {
  id: 't1', name: 'Board', description: '', createdAt: '', participantCount: 1,
  status: 'active' as const, cardsBlurred: false, participants: [], owner: 'u1',
  categories: { 'cat-1': { title: 'Went Well', color: 'bg-green-500' } },
} satisfies RetroTable

const defaults = {
  cards, table, onVote: vi.fn(), onDelete: vi.fn(),
  blurred: false, canDrag: true, canDelete: true,
}

describe('CardListView', () => {
  it('renders a card for each item', () => {
    render(<CardListView {...defaults} />)
    expect(screen.getAllByTestId('draggable-card')).toHaveLength(2)
  })

  it('does not render column headers', () => {
    render(<CardListView {...defaults} />)
    expect(screen.queryByText('Went Well')).not.toBeInTheDocument()
  })
})
