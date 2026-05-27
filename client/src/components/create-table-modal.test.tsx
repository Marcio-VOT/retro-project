import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CreateTableModal } from './create-table-modal'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))

const mockCreateTable = vi.fn()
vi.mock('@/hooks/use-api', () => ({
  useCreateTable: () => ({ createTable: mockCreateTable, loading: false }),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CreateTableModal', () => {
  it('renders children as trigger', () => {
    render(
      <CreateTableModal>
        <button>Open Modal</button>
      </CreateTableModal>
    )
    expect(screen.getByText('Open Modal')).toBeInTheDocument()
  })

  it('opens modal when trigger child is clicked', () => {
    render(
      <CreateTableModal>
        <button>Open</button>
      </CreateTableModal>
    )
    expect(screen.queryByText('Create New Retrospective')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Open'))
    expect(screen.getByText('Create New Retrospective')).toBeInTheDocument()
  })

  it('closes modal when Cancel is clicked', () => {
    render(
      <CreateTableModal>
        <button>Open</button>
      </CreateTableModal>
    )
    fireEvent.click(screen.getByText('Open'))
    expect(screen.getByText('Create New Retrospective')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByText('Create New Retrospective')).not.toBeInTheDocument()
  })

  it('submits form and navigates on success', async () => {
    mockCreateTable.mockResolvedValue({ id: 'table-123' })
    render(
      <CreateTableModal>
        <button>Open</button>
      </CreateTableModal>
    )
    fireEvent.click(screen.getByText('Open'))
    fireEvent.change(screen.getByPlaceholderText(/Sprint 24/), { target: { value: 'My Retro' } })
    fireEvent.click(screen.getByText('Create Table'))

    await waitFor(() => {
      expect(mockCreateTable).toHaveBeenCalledWith({ name: 'My Retro', description: '' })
      expect(mockPush).toHaveBeenCalledWith('/table/table-123')
    })
  })

  it('Create Table button is disabled when name is empty', () => {
    render(
      <CreateTableModal>
        <button>Open</button>
      </CreateTableModal>
    )
    fireEvent.click(screen.getByText('Open'))
    expect(screen.getByText('Create Table').closest('button')).toBeDisabled()
  })

  it('Create Table button is enabled when name has value', () => {
    render(
      <CreateTableModal>
        <button>Open</button>
      </CreateTableModal>
    )
    fireEvent.click(screen.getByText('Open'))
    fireEvent.change(screen.getByPlaceholderText(/Sprint 24/), { target: { value: 'Sprint 25' } })
    expect(screen.getByText('Create Table').closest('button')).not.toBeDisabled()
  })
})
