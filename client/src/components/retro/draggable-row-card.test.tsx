import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DraggableRowCard } from './draggable-row-card'
import type { RetroCard, RetroTable } from '@/types'

vi.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({ attributes: {}, listeners: {}, setNodeRef: vi.fn(), transform: null, isDragging: false }),
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
}))

const card: RetroCard = {
  id: 'c1', content: 'Row card content', authorId: 'u1', authorType: 'user',
  authorName: 'Bob', categoryId: 'cat-1', votes: 1, isAnonymous: false,
  createdAt: new Date().toISOString(), isVotedByMe: false,
}

const table = {
  id: 't1', name: 'Board', description: '', createdAt: '', participantCount: 1,
  status: 'active' as const, cardsBlurred: false, participants: [], owner: 'u1',
  categories: { 'cat-1': { title: 'Went Well', color: 'bg-green-500' } },
} satisfies RetroTable

const defaults = {
  card, table, onVote: vi.fn(), onDelete: vi.fn(),
  blurred: false, canDrag: true, canDelete: true, votingCardId: null,
}

describe('DraggableRowCard', () => {
  it('renders card content', () => {
    render(<DraggableRowCard {...defaults} />)
    expect(screen.getByText('Row card content')).toBeInTheDocument()
  })

  it('applies blur class when blurred is true', () => {
    render(<DraggableRowCard {...defaults} blurred={true} />)
    expect(document.querySelector('.blur-sm')).toBeInTheDocument()
  })

  it('shows drag handle when canDrag is true', () => {
    render(<DraggableRowCard {...defaults} canDrag={true} />)
    expect(screen.getByTitle('Drag to merge')).toBeInTheDocument()
  })

  it('hides drag handle when canDrag is false', () => {
    render(<DraggableRowCard {...defaults} canDrag={false} />)
    expect(screen.queryByTitle('Drag to merge')).not.toBeInTheDocument()
  })

  it('sets data-draggable="true" when canDrag is true', () => {
    const { container } = render(<DraggableRowCard {...defaults} canDrag={true} />)
    expect(container.querySelector('[data-draggable="true"]')).toBeInTheDocument()
  })

  it('disables vote button when votingCardId matches this card', () => {
    render(<DraggableRowCard {...defaults} votingCardId="c1" />)
    expect(screen.getByTitle('Vote')).toBeDisabled()
  })

  it('calls onVote when vote button is clicked', () => {
    const onVote = vi.fn()
    render(<DraggableRowCard {...defaults} onVote={onVote} />)
    fireEvent.click(screen.getByTitle('Vote'))
    expect(onVote).toHaveBeenCalledWith('c1')
  })

  it('shows delete button when canDelete is true', () => {
    render(<DraggableRowCard {...defaults} canDelete={true} />)
    expect(screen.getByTitle('Delete card')).toBeInTheDocument()
  })

  it('hides delete button when canDelete is false', () => {
    render(<DraggableRowCard {...defaults} canDelete={false} />)
    expect(screen.queryByTitle('Delete card')).not.toBeInTheDocument()
  })
})
