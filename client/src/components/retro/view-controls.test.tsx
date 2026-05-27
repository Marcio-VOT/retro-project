import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ViewControls } from './view-controls'

const defaults = {
  displayMode: 'grid' as const,
  sortBy: 'date' as const,
  sortOrder: 'desc' as const,
  isMobile: false,
  onDisplayModeChange: vi.fn(),
  onSortByChange: vi.fn(),
  onSortOrderChange: vi.fn(),
}

describe('ViewControls', () => {
  it('renders display mode buttons', () => {
    render(<ViewControls {...defaults} />)
    expect(screen.getByTitle('Grid view')).toBeInTheDocument()
    expect(screen.getByTitle('Rows view')).toBeInTheDocument()
    expect(screen.getByTitle('List view')).toBeInTheDocument()
  })

  it('calls onDisplayModeChange when a mode button is clicked', () => {
    const onDisplayModeChange = vi.fn()
    render(<ViewControls {...defaults} onDisplayModeChange={onDisplayModeChange} />)
    fireEvent.click(screen.getByTitle('Rows view'))
    expect(onDisplayModeChange).toHaveBeenCalledWith('rows')
  })

  it('calls onSortByChange when a sort button is clicked', () => {
    const onSortByChange = vi.fn()
    render(<ViewControls {...defaults} onSortByChange={onSortByChange} />)
    fireEvent.click(screen.getByTitle('Sort by votes'))
    expect(onSortByChange).toHaveBeenCalledWith('votes')
  })

  it('calls onSortOrderChange to toggle order', () => {
    const onSortOrderChange = vi.fn()
    render(<ViewControls {...defaults} onSortOrderChange={onSortOrderChange} />)
    fireEvent.click(screen.getByTitle('Toggle sort order'))
    expect(onSortOrderChange).toHaveBeenCalledWith('asc')
  })

  it('shows mobile auto-rows badge when isMobile is true and displayMode is grid', () => {
    render(<ViewControls {...defaults} isMobile={true} displayMode="grid" />)
    expect(screen.getByText(/auto.*rows/i)).toBeInTheDocument()
  })

  it('does not show mobile badge when not on mobile', () => {
    render(<ViewControls {...defaults} isMobile={false} />)
    expect(screen.queryByText(/auto.*rows/i)).not.toBeInTheDocument()
  })
})
