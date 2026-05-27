import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DraggableCard } from './draggable-card'
import type { RetroCard, RetroTable } from '@/types'

vi.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({ attributes: {}, listeners: {}, setNodeRef: vi.fn(), transform: null, isDragging: false }),
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
}))

const card: RetroCard = {
  id: 'c1', content: 'Test feedback', authorId: 'u1', authorType: 'user',
  authorName: 'Alice', categoryId: 'cat-1', votes: 3, isAnonymous: false,
  createdAt: new Date().toISOString(), isVotedByMe: false,
}

const table = {
  id: 't1', name: 'Board', description: '', createdAt: '', participantCount: 1,
  status: 'active' as const, cardsBlurred: false, participants: [], owner: 'u1',
  categories: { 'cat-1': { title: 'Went Well', color: 'bg-green-500' } },
} satisfies RetroTable

const defaults = {
  card, table, onVote: vi.fn(), onDelete: vi.fn(),
  blurred: false, canDrag: true, canDelete: true,
}

describe('DraggableCard', () => {
  it('renders card content', () => {
    render(<DraggableCard {...defaults} />)
    expect(screen.getByText('Test feedback')).toBeInTheDocument()
  })

  it('applies blur class when blurred is true', () => {
    render(<DraggableCard {...defaults} blurred={true} />)
    expect(document.querySelector('.blur-sm')).toBeInTheDocument()
  })

  it('does not apply blur class when blurred is false', () => {
    render(<DraggableCard {...defaults} blurred={false} />)
    expect(document.querySelector('.blur-sm')).not.toBeInTheDocument()
  })

  it('calls onVote when vote button is clicked', () => {
    const onVote = vi.fn()
    render(<DraggableCard {...defaults} onVote={onVote} />)
    fireEvent.click(screen.getByTitle('Vote'))
    expect(onVote).toHaveBeenCalledWith('c1')
  })

  it('shows delete button when canDelete is true', () => {
    render(<DraggableCard {...defaults} canDelete={true} />)
    expect(screen.getByTitle('Delete card')).toBeInTheDocument()
  })

  it('hides delete button when canDelete is false', () => {
    render(<DraggableCard {...defaults} canDelete={false} />)
    expect(screen.queryByTitle('Delete card')).not.toBeInTheDocument()
  })

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn()
    render(<DraggableCard {...defaults} onDelete={onDelete} />)
    fireEvent.click(screen.getByTitle('Delete card'))
    expect(onDelete).toHaveBeenCalledWith('c1')
  })

  it('sets data-draggable="true" when canDrag is true', () => {
    const { container } = render(<DraggableCard {...defaults} canDrag={true} />)
    expect(container.querySelector('[data-draggable="true"]')).toBeInTheDocument()
  })

  it('does not set data-draggable="true" when canDrag is false', () => {
    const { container } = render(<DraggableCard {...defaults} canDrag={false} />)
    expect(container.querySelector('[data-draggable="true"]')).not.toBeInTheDocument()
  })

  it('shows grip handle when canDrag is true', () => {
    render(<DraggableCard {...defaults} canDrag={true} />)
    expect(screen.getByTitle('Drag to reorder')).toBeInTheDocument()
  })

  it('hides grip handle when canDrag is false', () => {
    render(<DraggableCard {...defaults} canDrag={false} />)
    expect(screen.queryByTitle('Drag to reorder')).not.toBeInTheDocument()
  })
})
