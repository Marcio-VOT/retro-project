import React, { createContext, useContext, useState } from 'react'
import { cn } from '@/lib/utils'
import type { RetroCategory, RetroCard } from '@/types'

// Context for the retro board
interface RetroBoardContextType {
  categories: RetroCategory[]
  addCategory: (category: RetroCategory) => void
  removeCategory: (categoryId: string) => void
  addCard: (categoryId: string, card: RetroCard) => void
  removeCard: (cardId: string) => void
  updateCard: (cardId: string, updates: Partial<RetroCard>) => void
}

const RetroBoardContext = createContext<RetroBoardContextType | undefined>(undefined)

// Hook to use the retro board context
export const useRetroBoard = (): RetroBoardContextType => {
  const context = useContext(RetroBoardContext)
  if (!context) {
    throw new Error('useRetroBoard must be used within a RetroBoard')
  }
  return context
}

// Main RetroBoard component
interface RetroBoardProps {
  children: React.ReactNode
  className?: string
  initialCategories?: RetroCategory[]
}

export const RetroBoard: React.FC<RetroBoardProps> & {
  Header: typeof RetroBoardHeader
  Category: typeof RetroCategoryComponent
  Card: typeof RetroCardComponent
  Footer: typeof RetroBoardFooter
} = ({ children, className, initialCategories = [] }) => {
  const [categories, setCategories] = useState<RetroCategory[]>(initialCategories)

  const addCategory = (category: RetroCategory): void => {
    setCategories((prev) => [...prev, category])
  }

  const removeCategory = (categoryId: string): void => {
    setCategories((prev) => prev.filter((cat) => cat.id !== categoryId))
  }

  const addCard = (categoryId: string, card: RetroCard): void => {
    setCategories((prev) => prev.map((cat) => 
      cat.id === categoryId 
        ? { ...cat, cards: [...cat.cards, card] }
        : cat
    ))
  }

  const removeCard = (cardId: string): void => {
    setCategories((prev) => prev.map((cat) => ({
      ...cat,
      cards: cat.cards.filter((card) => card.id !== cardId)
    })))
  }

  const updateCard = (cardId: string, updates: Partial<RetroCard>): void => {
    setCategories((prev) => prev.map((cat) => ({
      ...cat,
      cards: cat.cards.map((card) => 
        card.id === cardId ? { ...card, ...updates } : card
      )
    })))
  }

  const contextValue: RetroBoardContextType = {
    categories,
    addCategory,
    removeCategory,
    addCard,
    removeCard,
    updateCard,
  }

  return (
    <RetroBoardContext.Provider value={contextValue}>
      <div className={cn('w-full h-full', className)}>
        {children}
      </div>
    </RetroBoardContext.Provider>
  )
}

// RetroBoard Header component
interface RetroBoardHeaderProps {
  children: React.ReactNode
  className?: string
}

export const RetroBoardHeader: React.FC<RetroBoardHeaderProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn('p-4 border-b bg-background', className)}>
      {children}
    </div>
  )
}

// RetroCategory component
interface RetroCategoryComponentProps {
  category: RetroCategory
  children?: React.ReactNode
  className?: string
  onAddCard?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export const RetroCategoryComponent: React.FC<RetroCategoryComponentProps> = ({
  category,
  children,
  className,
  onAddCard,
  onEdit,
  onDelete,
}) => {
  return (
    <div 
      className={cn(
        'flex flex-col h-full min-h-[400px] bg-card rounded-lg border',
        className
      )}
      style={{ borderLeftColor: category.color, borderLeftWidth: '4px' }}
    >
      <div className="p-4 border-b bg-muted/50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{category.name}</h3>
          <div className="flex items-center gap-2">
            {onAddCard && (
              <button
                onClick={onAddCard}
                className="p-1 hover:bg-accent rounded"
                title="Add card"
              >
                +
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1 hover:bg-accent rounded"
                title="Edit category"
              >
                ✏️
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1 hover:bg-destructive/10 text-destructive rounded"
                title="Delete category"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

// RetroCard component
interface RetroCardComponentProps {
  card: RetroCard
  className?: string
  onEdit?: () => void
  onDelete?: () => void
  onVote?: () => void
  canVote?: boolean
}

export const RetroCardComponent: React.FC<RetroCardComponentProps> = ({
  card,
  className,
  onEdit,
  onDelete,
  onVote,
  canVote = true,
}) => {
  return (
    <div className={cn(
      'p-3 bg-background border rounded-lg shadow-sm hover:shadow-md transition-shadow',
      className
    )}>
      <div className="flex items-start justify-between gap-2">
        <p className="flex-1 text-sm">{card.content}</p>
        <div className="flex items-center gap-1">
          {onVote && canVote && (
            <button
              onClick={onVote}
              className="p-1 hover:bg-accent rounded text-xs"
              title="Vote"
            >
              👍 {card.votes}
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1 hover:bg-accent rounded text-xs"
              title="Edit card"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 hover:bg-destructive/10 text-destructive rounded text-xs"
              title="Delete card"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        by {card.author}
      </div>
    </div>
  )
}

// RetroBoard Footer component
interface RetroBoardFooterProps {
  children: React.ReactNode
  className?: string
}

export const RetroBoardFooter: React.FC<RetroBoardFooterProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn('p-4 border-t bg-background', className)}>
      {children}
    </div>
  )
}

// Attach sub-components to main component
RetroBoard.Header = RetroBoardHeader
RetroBoard.Category = RetroCategoryComponent
RetroBoard.Card = RetroCardComponent
RetroBoard.Footer = RetroBoardFooter 