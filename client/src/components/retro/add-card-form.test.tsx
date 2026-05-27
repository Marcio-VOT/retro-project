import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AddCardForm } from './add-card-form'

const categories = {
  'cat-1': { title: 'Went Well', color: 'bg-green-500' },
  'cat-2': { title: 'To Improve', color: 'bg-red-500' },
}

const defaults = {
  categories,
  newCard: { content: '', categoryId: 'cat-1' },
  isAddingCard: false,
  showAnonymous: false,
  isGuest: false,
  onContentChange: vi.fn(),
  onCategoryChange: vi.fn(),
  onAnonymousChange: vi.fn(),
  onSubmit: vi.fn(),
}

describe('AddCardForm', () => {
  it('renders textarea and category buttons', () => {
    render(<AddCardForm {...defaults} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByText('Went Well')).toBeInTheDocument()
    expect(screen.getByText('To Improve')).toBeInTheDocument()
  })

  it('calls onContentChange when textarea value changes', () => {
    const onContentChange = vi.fn()
    render(<AddCardForm {...defaults} onContentChange={onContentChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new idea' } })
    expect(onContentChange).toHaveBeenCalledWith('new idea')
  })

  it('calls onCategoryChange when category button is clicked', () => {
    const onCategoryChange = vi.fn()
    render(<AddCardForm {...defaults} onCategoryChange={onCategoryChange} />)
    fireEvent.click(screen.getByText('To Improve'))
    expect(onCategoryChange).toHaveBeenCalledWith('cat-2')
  })

  it('submit button is disabled when content is empty', () => {
    render(<AddCardForm {...defaults} newCard={{ content: '', categoryId: 'cat-1' }} />)
    expect(screen.getByRole('button', { name: /post/i })).toBeDisabled()
  })

  it('submit button is disabled while isAddingCard is true', () => {
    render(<AddCardForm {...defaults} newCard={{ content: 'something', categoryId: 'cat-1' }} isAddingCard={true} />)
    expect(screen.getByRole('button', { name: /posting/i })).toBeDisabled()
  })

  it('calls onSubmit when submit button is clicked with content', () => {
    const onSubmit = vi.fn()
    render(<AddCardForm {...defaults} newCard={{ content: 'hello', categoryId: 'cat-1' }} onSubmit={onSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: /post/i }))
    expect(onSubmit).toHaveBeenCalled()
  })

  it('anonymous checkbox is checked and disabled for guests', () => {
    render(<AddCardForm {...defaults} isGuest={true} showAnonymous={true} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
    expect(checkbox).toBeDisabled()
  })

  it('anonymous checkbox is enabled for non-guests', () => {
    render(<AddCardForm {...defaults} isGuest={false} />)
    expect(screen.getByRole('checkbox')).not.toBeDisabled()
  })
})
