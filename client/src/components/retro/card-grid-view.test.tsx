import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CardGridView } from './card-grid-view'
import type { RetroCard, RetroTable } from '@/types'

vi.mock('./draggable-card', () => ({
  DraggableCard: ({ card }: { card: RetroCard }) => <div data-testid="draggable-card">{card.content}</div>,
}))

const categories = {
  'cat-1': { title: 'Went Well', color: 'bg-green-500' },
  'cat-2': { title: 'To Improve', color: 'bg-red-500' },
}

const cards: RetroCard[] = [
  { id: 'c1', content: 'Card 1', authorId: 'u1', authorType: 'user', authorName: 'Alice',
    categoryId: 'cat-1', votes: 0, isAnonymous: false, createdAt: '', isVotedByMe: false },
  { id: 'c2', content: 'Card 2', authorId: 'u1', authorType: 'user', authorName: 'Alice',
    categoryId: 'cat-2', votes: 0, isAnonymous: false, createdAt: '', isVotedByMe: false },
]

const table = {
  id: 't1', name: 'Board', description: '', createdAt: '', participantCount: 1,
  status: 'active' as const, cardsBlurred: false, participants: [], owner: 'u1', categories,
} satisfies RetroTable

const defaults = {
  categories, cards, table,
  onVote: vi.fn(), onDelete: vi.fn(),
  blurred: false, canDrag: true, canDelete: true,
}

describe('CardGridView', () => {
  it('renders a column header for each category', () => {
    render(<CardGridView {...defaults} />)
    expect(screen.getByText('Went Well')).toBeInTheDocument()
    expect(screen.getByText('To Improve')).toBeInTheDocument()
  })

  it('renders the correct number of cards', () => {
    render(<CardGridView {...defaults} />)
    expect(screen.getAllByTestId('draggable-card')).toHaveLength(2)
  })

  it('only shows cards for their respective column', () => {
    render(<CardGridView {...defaults} />)
    expect(screen.getByText('Card 1')).toBeInTheDocument()
    expect(screen.getByText('Card 2')).toBeInTheDocument()
  })

  it('renders nothing when cards array is empty', () => {
    const { container } = render(<CardGridView {...defaults} cards={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
