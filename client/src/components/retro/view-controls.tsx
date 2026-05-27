"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Grid3X3, Rows, List, Calendar, TrendingUp, User, ArrowUpDown } from 'lucide-react'

interface ViewControlsProps {
  displayMode: 'list' | 'grid' | 'rows'
  sortBy: 'votes' | 'date' | 'author'
  sortOrder: 'asc' | 'desc'
  isMobile: boolean
  onDisplayModeChange: (mode: 'list' | 'grid' | 'rows') => void
  onSortByChange: (sortBy: 'votes' | 'date' | 'author') => void
  onSortOrderChange: (order: 'asc' | 'desc') => void
}

export function ViewControls({
  displayMode,
  sortBy,
  sortOrder,
  isMobile,
  onDisplayModeChange,
  onSortByChange,
  onSortOrderChange,
}: ViewControlsProps) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Display:</span>
        <div className="flex items-center gap-1">
          <Button
            variant={displayMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onDisplayModeChange('grid')}
            className="h-8 px-3"
            title="Grid view"
          >
            <Grid3X3 className="h-4 w-4" />
            {displayMode === 'grid' && isMobile && (
              <Badge variant="secondary" className="ml-1 text-xs">→ rows</Badge>
            )}
          </Button>
          <Button
            variant={displayMode === 'rows' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onDisplayModeChange('rows')}
            className="h-8 px-3"
            title="Rows view"
          >
            <Rows className="h-4 w-4" />
          </Button>
          <Button
            variant={displayMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onDisplayModeChange('list')}
            className="h-8 px-3"
            title="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
        {displayMode === 'grid' && isMobile && (
          <span className="text-xs text-muted-foreground">
            (Auto-switched to rows on mobile)
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
        <div className="flex items-center gap-1">
          <Button
            variant={sortBy === 'date' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSortByChange('date')}
            className="h-8 px-3"
            title="Sort by date"
          >
            <Calendar className="h-4 w-4 mr-1" />
            Date
          </Button>
          <Button
            variant={sortBy === 'votes' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSortByChange('votes')}
            className="h-8 px-3"
            title="Sort by votes"
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Votes
          </Button>
          <Button
            variant={sortBy === 'author' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSortByChange('author')}
            className="h-8 px-3"
            title="Sort by author"
          >
            <User className="h-4 w-4 mr-1" />
            Author
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="h-8 px-3"
            title="Toggle sort order"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
