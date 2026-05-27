"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Users, Clock, Archive, Eye, EyeOff, Share2, Trash2, GripVertical } from 'lucide-react'
import { ProtectedRoute } from '@/components/protected-route'
import { useSSE } from '@/hooks/useSSE'
import { ShareModal } from '@/components/share-modal'
import { TopicManagerModal } from '@/components/topic-manager-modal'
import { DeleteTableModal } from '@/components/delete-table-modal'
import { useAuthStore } from '@/stores/auth-store'
import { useGuestStore } from '@/stores/guest-store'
import { useVoteCard, useAddCard, useArchiveTable, useShareTable, useJoinAsGuest, useGetTableWithAccess, useGetCards, useCreateTopic, useRemoveTopic, useMergeCards, useDeleteCard, useDeleteTable, useToggleBlur } from '@/hooks/use-api'
import { RetroCard, RetroTable } from '@/types'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { Toaster, toast } from 'sonner'
import { getColorFromClass } from '@/lib/color-utils'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { CategoryTabs } from '@/components/retro/category-tabs'
import { AddCardForm } from '@/components/retro/add-card-form'
import { ViewControls } from '@/components/retro/view-controls'
import { CardGridView } from '@/components/retro/card-grid-view'
import { CardRowsView } from '@/components/retro/card-rows-view'
import { CardListView } from '@/components/retro/card-list-view'

function TableViewContent(): JSX.Element {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tableId = params.id as string
  const { isAuthenticated } = useAuthStore()
  const { isGuest, guestUser, joinAsGuest: joinAsGuestStore } = useGuestStore()
  const { shareTable } = useShareTable()
  const { joinAsGuest: joinAsGuestApi } = useJoinAsGuest()
  const { getTableWithAccess } = useGetTableWithAccess()
  const { getCards } = useGetCards()
  const { voteCard } = useVoteCard()
  const { addCard } = useAddCard()
  const { archiveTable } = useArchiveTable()
  const { createTopic } = useCreateTopic()
  const { removeTopic } = useRemoveTopic()
  const { mergeCards } = useMergeCards()
  const { deleteCard } = useDeleteCard()
  const { deleteTable, loading: isDeletingTable } = useDeleteTable()
  const { toggleBlur } = useToggleBlur()

  const [table, setTable] = useState<RetroTable | null>(null)
  const [cards, setCards] = useState<RetroCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newCard, setNewCard] = useState({ content: '', categoryId: '' as string })
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [showAnonymous, setShowAnonymous] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [isOwner, setIsOwner] = useState(false)
  const [showTopicManager, setShowTopicManager] = useState(false)
  const [newTopic, setNewTopic] = useState({ title: '', color: 'bg-gray-500 text-white' })
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [isArchiving, setIsArchiving] = useState(false)
  const [votingCardId, setVotingCardId] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [displayMode, setDisplayMode] = useState<'list' | 'grid' | 'rows'>('grid')
  const [sortBy, setSortBy] = useState<'votes' | 'date' | 'author'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  )

  // Set anonymous mode for guests
  useEffect(() => {
    if (isGuest) {
      setShowAnonymous(true)
    }
  }, [isGuest])

  // Set default category when table is loaded
  useEffect(() => {
    if (table && table.categories && Object.keys(table.categories).length > 0) {
      const firstCategoryKey = Object.keys(table.categories)[0]
      if (firstCategoryKey) {
        setNewCard(prev => ({ ...prev, categoryId: firstCategoryKey }))
      }
    }
  }, [table])

  // SSE — real-time board updates
  useSSE(tableId, {
    guestToken: guestUser?.tempToken,
    onMessage: (eventType, data) => {
      if (eventType === 'cards:updated' || eventType === 'votes:updated') {
        setCards(data as RetroCard[])
      } else if (eventType === 'topics:updated') {
        setTable(prev => prev ? { ...prev, categories: data as RetroTable['categories'] } : prev)
      } else if (eventType === 'table:updated') {
        const payload = data as { cardsBlurred: boolean }
        setTable(prev => prev ? { ...prev, cardsBlurred: payload.cardsBlurred } : prev)
      } else if (eventType === 'table:archived') {
        setTable(prev => prev ? { ...prev, status: 'archived' } : prev)
      }
    },
  })

  // Load table data with secure access
  useEffect(() => {
    const loadTable = async () => {
      setIsLoading(true)
      try {
        const inviteToken = searchParams.get('invite')
        const result = await getTableWithAccess(tableId, inviteToken || undefined)
        
        if (result?.success && result.accessGranted) {
          setTable(result.table)
          setIsOwner(result.isOwner)
          
          // Load cards for the table
          const cardsData = await getCards(tableId)
          if (cardsData) {
            // Convert from grouped categories to flat array
            const flatCards = Object.values(cardsData).flat()
            setCards(flatCards)
          }
        } else {
          toast.error('You do not have access to this table.')
          router.push('/home')
        }
      } catch (error) {
        toast.error('Failed to load table.')
        router.push('/home')
      } finally {
        setIsLoading(false)
      }
    }

    loadTable()
  }, [tableId, searchParams, getTableWithAccess, getCards, router])

  const handleAddCard = async () => {
    if (!newCard.content.trim() || !newCard.categoryId) return
    setIsAddingCard(true)
    try {
      const result = await addCard({
        content: newCard.content.trim(),
        categoryId: newCard.categoryId,
        isAnonymous: showAnonymous,
      })
      if (result && result.id) {
        // SSE broadcast (cards:updated) delivers the update to all clients including this one
        setNewCard({ content: '', categoryId: newCard.categoryId })
        toast.success('Card added!')
      }
    } catch (error) {
      toast.error('Failed to add card')
    } finally {
      setIsAddingCard(false)
    }
  }

  const handleVote = async (cardId: string) => {
    if (votingCardId === cardId) return
    setVotingCardId(cardId)
    
    try {
      const card = cards.find(c => c.id === cardId)
      if (!card) return
      
      const action = card.isVotedByMe ? 'unvote' : 'vote'
      const result = await voteCard(cardId, action)
      
      // SSE broadcast (votes:updated) delivers the update to all clients including this one
    } catch (error) {
      toast.error('Failed to vote')
    } finally {
      setVotingCardId(null)
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    if (!isOwner) {
      toast.error('Only the table owner can delete cards')
      return
    }
    
    try {
      const result = await deleteCard(cardId)
      
      if (result) {
        // SSE broadcast (cards:updated) delivers the update to all clients including this one
        toast.success('Card deleted!')
      }
    } catch (error) {
      toast.error('Failed to delete card')
    }
  }

  const handleAddTopic = async () => {
    if (!isTopicFormValid || !table) return
    
    try {
      const result = await createTopic(tableId, {
        title: newTopic.title.trim(),
        color: newTopic.color,
      })
      
      if (result && result.id) {
        // SSE broadcast (topics:updated) delivers the update to all clients including this one
        setNewTopic({ title: '', color: 'bg-gray-500 text-white' })
        setShowTopicManager(false)
        toast.success('Topic added!')
      }
    } catch (error) {
      toast.error('Failed to add topic')
    }
  }

  const handleRemoveTopic = async (topicKey: string) => {
    if (!table || !isOwner) return
    
    try {
      const result = await removeTopic(tableId, topicKey)
      
      if (result) {
        // SSE broadcasts topics:updated + cards:updated to all clients including this one
        toast.success('Topic removed!')
      }
    } catch (error) {
      toast.error('Failed to remove topic')
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    console.log('Drag start:', { id: event.active.id, type: event.active.data.current?.type })
    setActiveDragId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDragId(null)

    if (!over) return

    const draggedCardId = active.id as string
    const targetCardId = (over.id as string).replace('drop-', '')

    console.log('Card IDs:', { draggedCardId, targetCardId })

    // Don't merge if dropped on itself
    if (draggedCardId === targetCardId) {
      console.log('Dropped on itself, ignoring')
      return
    }

    const draggedCard = cards.find(card => card.id === draggedCardId)
    const targetCard = cards.find(card => card.id === targetCardId)

    console.log('Found cards:', { draggedCard: !!draggedCard, targetCard: !!targetCard })

    if (draggedCard && targetCard) {
      console.log('Merging cards:', { draggedCardId, targetCardId })
      handleMergeCards(draggedCard, targetCard)
    } else {
      console.log('Could not find one or both cards')
    }
  }

  const handleMergeCards = async (draggedCard: RetroCard, targetCard: RetroCard) => {
    if (!isOwner) {
      toast.error('Only the table owner can merge cards')
      return
    }
    
    try {
      const result = await mergeCards(draggedCard.id, targetCard.id)
      
      if (result) {
        // SSE broadcast (cards:updated) delivers the update to all clients including this one
        toast.success('Cards merged successfully')
      }
    } catch (error) {
      toast.error('Failed to merge cards')
    }
  }

  const handleArchive = async () => {
    if (!isOwner) {
      toast.error('Only the table owner can archive the table')
      return
    }
    
    if (!table || isArchiving) return

    setIsArchiving(true)

    try {
      const result = await archiveTable(tableId)
      
      if (result) {
        // Update local state
        setTable(prev => prev ? { ...prev, status: 'archived' as const } : null)
        
        // Show success feedback
        toast.success('Table archived successfully')
      }
    } catch (error) {
      toast.error('Failed to archive table')
    } finally {
      setIsArchiving(false)
    }
  }

  const handleShare = async (email: string, message?: string) => {
    if (!isOwner) {
      toast.error('Only the table owner can share the table')
      return
    }
    
    if (!table) return

    try {
      const result = await shareTable(tableId, email, message)
      
      if (result) {
        toast.success('Invitation sent successfully')
        setShowShareModal(false)
      }
    } catch (error) {
      toast.error('Failed to send invitation')
    }
  }

  const handleDeleteTable = async () => {
    if (!isOwner) {
      toast.error('Only the table owner can delete the table')
      return
    }
    
    try {
      const result = await deleteTable(tableId)
      if (result) {
        toast.success('Table deleted successfully')
        router.push('/home')
      }
    } catch (error) {
      toast.error('Failed to delete table')
    }
  }

  // Sort cards based on current sort settings
  const sortedCards = [...cards].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'votes':
        comparison = a.votes - b.votes
        break
      case 'date':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      case 'author':
        comparison = a.authorName.localeCompare(b.authorName)
        break
      default:
        comparison = 0
    }
    
    return sortOrder === 'desc' ? -comparison : comparison
  })

  // Filter cards by active category
  const filteredCards = activeCategory === 'all' 
    ? sortedCards 
    : sortedCards.filter(card => card.categoryId === activeCategory)

  const isMobile = useIsMobile()

  // Determine effective display mode (auto-switch to rows on mobile for grid mode)
  const effectiveDisplayMode = displayMode === 'grid' && isMobile ? 'rows' : displayMode

  const isFormValid = newTopic.title.trim().length > 0

  // Check if topic name is duplicate
  const isTopicNameDuplicate = Boolean(table && newTopic.title.trim() && 
    Object.values(table.categories).some(cat => 
      cat.title.toLowerCase() === newTopic.title.trim().toLowerCase()
    ))

  const isTopicFormValid = newTopic.title.trim().length > 0 && !isTopicNameDuplicate

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!table) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Table not found</h2>
            <p className="text-muted-foreground mb-4">The retrospective table you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/home')}>Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{table.name}</h1>
            <p className="text-muted-foreground">{table.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={table.status === 'active' ? 'default' : 'secondary'}>
              {table.status}
            </Badge>
            {isOwner && table.status === 'active' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleBlur(tableId)}
                  className="flex items-center gap-2"
                >
                  {table.cardsBlurred ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {table.cardsBlurred ? 'Show Cards' : 'Hide Cards'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </>
            )}
            {isOwner && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleArchive}
                  disabled={isArchiving || table?.status === 'archived'}
                  className="flex items-center gap-2"
                >
                  {isArchiving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Archiving...
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4" />
                      {table?.status === 'archived' ? 'Archived' : 'Archive'}
                    </>
                  )}
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {table.participantCount} participants
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Created {new Date().toLocaleDateString()}
          </span>
        </div>
      </div>

      <CategoryTabs
        categories={table.categories}
        cards={cards}
        activeCategory={activeCategory}
        isOwner={isOwner}
        tableStatus={table.status}
        onCategoryChange={setActiveCategory}
        onRemoveTopic={handleRemoveTopic}
        onAddTopicClick={() => setShowTopicManager(true)}
      />



      {table.status === 'active' && (
        <AddCardForm
          categories={table.categories}
          newCard={newCard}
          isAddingCard={isAddingCard}
          showAnonymous={showAnonymous}
          isGuest={isGuest}
          onContentChange={(content) => setNewCard(prev => ({ ...prev, content }))}
          onCategoryChange={(categoryId) => setNewCard(prev => ({ ...prev, categoryId }))}
          onAnonymousChange={setShowAnonymous}
          onSubmit={handleAddCard}
        />
      )}

      <ViewControls
        displayMode={displayMode}
        sortBy={sortBy}
        sortOrder={sortOrder}
        isMobile={isMobile}
        onDisplayModeChange={setDisplayMode}
        onSortByChange={setSortBy}
        onSortOrderChange={setSortOrder}
      />

      {table.status === 'archived' && (
        <Card className="mb-8 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-amber-800 dark:text-amber-200">
              <Archive className="h-5 w-5" />
              <div>
                <h3 className="font-medium">This retrospective has been archived</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  No new cards can be added to archived retrospectives. You can still view and export the existing data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards Display */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[]}
      >
        {effectiveDisplayMode === 'grid' ? (
          <CardGridView
            categories={table.categories}
            cards={filteredCards}
            table={table}
            onVote={handleVote}
            onDelete={handleDeleteCard}
            blurred={!!table.cardsBlurred}
            canDrag={table.status === 'active' && isOwner}
            canDelete={isOwner && table.status === 'active'}
          />
        ) : effectiveDisplayMode === 'rows' ? (
          <CardRowsView
            cards={filteredCards}
            table={table}
            onVote={handleVote}
            onDelete={handleDeleteCard}
            blurred={!!table.cardsBlurred}
            canDrag={table.status === 'active' && isOwner}
            canDelete={isOwner && table.status === 'active'}
            votingCardId={votingCardId}
          />
        ) : (
          <CardListView
            cards={filteredCards}
            table={table}
            onVote={handleVote}
            onDelete={handleDeleteCard}
            blurred={!!table.cardsBlurred}
            canDrag={table.status === 'active' && isOwner}
            canDelete={isOwner && table.status === 'active'}
          />
        )}

        <DragOverlay dropAnimation={null}>
          {activeDragId ? (
            <Card className="w-full max-w-sm shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const draggedCard = cards.find(card => card.id === activeDragId)
                      const categoryColor = draggedCard && table.categories?.[draggedCard.categoryId]?.color
                      const badgeColor = categoryColor ? getColorFromClass(categoryColor) : '#6B7280'
                      
                      return (
                        <Badge 
                          variant="outline" 
                          style={{
                            backgroundColor: badgeColor,
                            color: 'white',
                            borderColor: badgeColor
                          }}
                        >
                          {draggedCard ? (table.categories?.[draggedCard.categoryId]?.title || draggedCard.categoryId) : 'Merging...'}
                        </Badge>
                      )
                    })()}
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className={`text-sm mb-3 break-words overflow-wrap-anywhere hyphens-auto ${table.cardsBlurred ? 'blur-sm select-none' : ''}`}>
                  {cards.find(card => card.id === activeDragId)?.content}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Drop to merge</span>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      {filteredCards.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No cards yet</h3>
            <p className="text-muted-foreground">
              Be the first to add a card to the {activeCategory === 'all' ? 'selected' : table.categories?.[activeCategory]?.title || 'selected'} category
            </p>
          </CardContent>
        </Card>
      )}

      {/* Topic Manager Modal */}
      <TopicManagerModal
        isOpen={showTopicManager}
        onClose={() => setShowTopicManager(false)}
        newTopic={newTopic}
        onNewTopicChange={setNewTopic}
        onAddTopic={handleAddTopic}
        isTopicFormValid={isTopicFormValid}
        isTopicNameDuplicate={isTopicNameDuplicate}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        tableId={tableId}
        tableName={table.name}
        onShare={handleShare}
      />

      {/* Delete Table Modal */}
      <DeleteTableModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteTable}
        tableName={table.name}
        isLoading={isDeletingTable}
      />
    </div>
  )
}

export default function TableViewPage(): JSX.Element {
  return (
    <ProtectedRoute>
      <Toaster />
      <TableViewContent />
    </ProtectedRoute>
  )
} 