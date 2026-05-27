"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { getColorFromClass } from '@/lib/color-utils'
import type { RetroCard, RetroTable } from '@/types'

interface CategoryTabsProps {
  categories: RetroTable['categories']
  cards: RetroCard[]
  activeCategory: string
  isOwner: boolean
  tableStatus: 'active' | 'archived'
  onCategoryChange: (categoryId: string) => void
  onRemoveTopic: (topicKey: string) => void
  onAddTopicClick: () => void
}

export function CategoryTabs({
  categories,
  cards,
  activeCategory,
  isOwner,
  tableStatus,
  onCategoryChange,
  onRemoveTopic,
  onAddTopicClick,
}: CategoryTabsProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategoryChange('all')}
          className="flex items-center gap-2"
        >
          <div className="w-3 h-3 rounded-full bg-gray-400" />
          All Topics
          <Badge variant="secondary" className="ml-1">
            {cards.length}
          </Badge>
        </Button>

        {Object.entries(categories).map(([key, category]) => (
          <Button
            key={key}
            variant={activeCategory === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategoryChange(key)}
            className="flex items-center gap-2"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getColorFromClass(category.color) }}
            />
            {category.title}
            <Badge variant="secondary" className="ml-1">
              {cards.filter(card => card.categoryId === key).length}
            </Badge>
            {isOwner && tableStatus === 'active' && (
              <span
                role="button"
                title="Remove topic"
                onClick={(e) => { e.stopPropagation(); onRemoveTopic(key) }}
                className="h-4 w-4 ml-1 inline-flex items-center justify-center rounded hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
              >
                ×
              </span>
            )}
          </Button>
        ))}

        {isOwner && tableStatus === 'active' && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAddTopicClick}
            className="flex items-center gap-2"
          >
            <Plus className="h-3 w-3" />
            Add Topic
          </Button>
        )}
      </div>
    </div>
  )
}
