import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CategoryTabs } from './category-tabs'
import type { RetroCard, RetroTable } from '@/types'

const categories: RetroTable['categories'] = {
  'cat-1': { title: 'Went Well', color: 'bg-green-500' },
  'cat-2': { title: 'To Improve', color: 'bg-red-500' },
}

const cards: RetroCard[] = [
  { id: 'c1', content: 'A', authorId: 'u1', authorType: 'user', authorName: 'Alice',
    categoryId: 'cat-1', votes: 0, isAnonymous: false, createdAt: '', isVotedByMe: false },
  { id: 'c2', content: 'B', authorId: 'u1', authorType: 'user', authorName: 'Alice',
    categoryId: 'cat-1', votes: 0, isAnonymous: false, createdAt: '', isVotedByMe: false },
  { id: 'c3', content: 'C', authorId: 'u1', authorType: 'user', authorName: 'Alice',
    categoryId: 'cat-2', votes: 0, isAnonymous: false, createdAt: '', isVotedByMe: false },
]

const defaults = {
  categories,
  cards,
  activeCategory: 'all',
  isOwner: true,
  tableStatus: 'active' as const,
  onCategoryChange: vi.fn(),
  onRemoveTopic: vi.fn(),
  onAddTopicClick: vi.fn(),
}

describe('CategoryTabs', () => {
  it('renders All Topics tab with total card count', () => {
    render(<CategoryTabs {...defaults} />)
    expect(screen.getByText('All Topics')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders a tab for each category', () => {
    render(<CategoryTabs {...defaults} />)
    expect(screen.getByText('Went Well')).toBeInTheDocument()
    expect(screen.getByText('To Improve')).toBeInTheDocument()
  })

  it('shows per-category card counts', () => {
    render(<CategoryTabs {...defaults} />)
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('calls onCategoryChange when a category tab is clicked', () => {
    const onCategoryChange = vi.fn()
    render(<CategoryTabs {...defaults} onCategoryChange={onCategoryChange} />)
    fireEvent.click(screen.getByText('Went Well'))
    expect(onCategoryChange).toHaveBeenCalledWith('cat-1')
  })

  it('calls onCategoryChange with "all" when All Topics is clicked', () => {
    const onCategoryChange = vi.fn()
    render(<CategoryTabs {...defaults} activeCategory="cat-1" onCategoryChange={onCategoryChange} />)
    fireEvent.click(screen.getByText('All Topics'))
    expect(onCategoryChange).toHaveBeenCalledWith('all')
  })

  it('shows delete button for categories when isOwner and tableStatus is active', () => {
    render(<CategoryTabs {...defaults} isOwner={true} tableStatus="active" />)
    expect(screen.getAllByTitle('Remove topic')).toHaveLength(2)
  })

  it('hides delete buttons when not owner', () => {
    render(<CategoryTabs {...defaults} isOwner={false} />)
    expect(screen.queryByTitle('Remove topic')).not.toBeInTheDocument()
  })

  it('hides delete buttons when table is archived', () => {
    render(<CategoryTabs {...defaults} isOwner={true} tableStatus="archived" />)
    expect(screen.queryByTitle('Remove topic')).not.toBeInTheDocument()
  })

  it('calls onRemoveTopic when delete button is clicked', () => {
    const onRemoveTopic = vi.fn()
    render(<CategoryTabs {...defaults} onRemoveTopic={onRemoveTopic} />)
    fireEvent.click(screen.getAllByTitle('Remove topic')[0]!)
    expect(onRemoveTopic).toHaveBeenCalledWith('cat-1')
  })

  it('shows Add Topic button for owner on active table', () => {
    render(<CategoryTabs {...defaults} isOwner={true} tableStatus="active" />)
    expect(screen.getByText('Add Topic')).toBeInTheDocument()
  })

  it('hides Add Topic button for non-owner', () => {
    render(<CategoryTabs {...defaults} isOwner={false} />)
    expect(screen.queryByText('Add Topic')).not.toBeInTheDocument()
  })

  it('hides Add Topic button when archived', () => {
    render(<CategoryTabs {...defaults} isOwner={true} tableStatus="archived" />)
    expect(screen.queryByText('Add Topic')).not.toBeInTheDocument()
  })

  it('calls onAddTopicClick when Add Topic is clicked', () => {
    const onAddTopicClick = vi.fn()
    render(<CategoryTabs {...defaults} onAddTopicClick={onAddTopicClick} />)
    fireEvent.click(screen.getByText('Add Topic'))
    expect(onAddTopicClick).toHaveBeenCalled()
  })
})
