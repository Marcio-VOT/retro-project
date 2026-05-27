"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Eye, EyeOff, Send } from 'lucide-react'
import { getColorFromClass } from '@/lib/color-utils'
import type { RetroTable } from '@/types'

interface AddCardFormProps {
  categories: RetroTable['categories']
  newCard: { content: string; categoryId: string }
  isAddingCard: boolean
  showAnonymous: boolean
  isGuest: boolean
  onContentChange: (content: string) => void
  onCategoryChange: (categoryId: string) => void
  onAnonymousChange: (checked: boolean) => void
  onSubmit: () => void
}

export function AddCardForm({
  categories,
  newCard,
  isAddingCard,
  showAnonymous,
  isGuest,
  onContentChange,
  onCategoryChange,
  onAnonymousChange,
  onSubmit,
}: AddCardFormProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Card
        </CardTitle>
        <CardDescription>
          Share your thoughts for the{' '}
          {categories[newCard.categoryId]?.title || 'selected'} category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Textarea
                placeholder="Enter your feedback..."
                value={newCard.content}
                onChange={(e) => onContentChange(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={showAnonymous}
                  onChange={(e) => onAnonymousChange(e.target.checked)}
                  disabled={isGuest}
                  className="rounded"
                />
                <label htmlFor="anonymous" className={`text-sm ${isGuest ? 'text-muted-foreground' : ''}`}>
                  Post anonymously{isGuest && ' (required for guests)'}
                </label>
              </div>
              <div className="flex items-center gap-2">
                {showAnonymous ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="text-xs text-muted-foreground">
                  {isGuest
                    ? 'Guest participants must post anonymously'
                    : showAnonymous
                      ? 'Will be posted anonymously'
                      : 'Will show your name'
                  }
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {Object.entries(categories).map(([key, category]) => (
                <Button
                  key={key}
                  variant={newCard.categoryId === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onCategoryChange(key)}
                  style={newCard.categoryId === key ? {
                    backgroundColor: getColorFromClass(category.color),
                    borderColor: getColorFromClass(category.color),
                    color: 'white',
                  } : {}}
                >
                  {category.title}
                </Button>
              ))}
            </div>
            <Button onClick={onSubmit} disabled={!newCard.content.trim() || isAddingCard}>
              <Send className="h-4 w-4 mr-2" />
              {isAddingCard ? 'Posting...' : 'Post Card'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
