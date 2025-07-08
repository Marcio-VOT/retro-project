"use client"

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  MessageSquare, 
  ThumbsUp, 
  Users, 
  Clock, 
  Archive,
  Eye,
  EyeOff,
  Send,
  GripVertical,
  Share2,
  Trash2,
  List,
  Grid3X3,
  Rows,
  ArrowUpDown,
  Calendar,
  User,
  TrendingUp
} from 'lucide-react'
import { ProtectedRoute } from '@/components/protected-route'
import { useSocket } from '@/hooks/use-socket'
import { Input } from '@/components/ui/input'
import { ColorPicker } from '@/components/ui/color-picker'
import { ShareModal } from '@/components/share-modal'
import { TopicManagerModal } from '@/components/topic-manager-modal'
import { DeleteTableModal } from '@/components/delete-table-modal'
import { useAuthStore } from '@/stores/auth-store'
import { useGuestStore } from '@/stores/guest-store'
import { useVoteCard, useAddCard, useArchiveTable, useShareTable, useJoinAsGuest, useGetTableWithAccess, useGetCards, useCreateTopic, useRemoveTopic, useMergeCards, useDeleteCard, useDeleteTable } from '@/hooks/use-api'
import { RetroTable } from '@/types'
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
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Toaster, toast } from 'sonner'

interface RetroCard {
  id: string
  content: string
  authorId?: string
  authorType: string
  authorName: string
  categoryId: string
  votes: number
  isAnonymous: boolean
  createdAt: string
  isVotedByMe: boolean
}

interface DraggableCardProps {
  card: RetroCard
  table: RetroTable
  onVote: (cardId: string) => void
  onDelete: (cardId: string) => void
  blurred: boolean
  canDrag: boolean
  getColorFromClass: (colorClass: string) => string
}

function DraggableCard({ card, table, onVote, onDelete, blurred, canDrag, getColorFromClass }: DraggableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setDragNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: card.id, disabled: !canDrag })

  const {
    setNodeRef: setDropNodeRef,
    isOver,
  } = useDroppable({ id: `drop-${card.id}` })

  // Combine refs for both drag and drop
  const setNodeRef = (node: HTMLElement | null) => {
    setDragNodeRef(node)
    setDropNodeRef(node)
  }

  // Only apply transform if this card is being dragged
  const style = {
    transform: isDragging ? CSS.Transform.toString(transform) : undefined,
    opacity: isDragging ? 0.5 : 1,
  }

  // Check if content contains merged separator
  const hasMergedContent = card.content.includes('\n\n---\n\n')
  const contentParts = hasMergedContent ? card.content.split('\n\n---\n\n') : [card.content]

  // Get the category color for the badge
  const categoryColor = table.categories?.[card.categoryId]?.color
  const badgeColor = categoryColor ? getColorFromClass(categoryColor) : '#6B7280'

  return (
    <Card 
      ref={setNodeRef} 
      className={`hover:shadow-md ${canDrag ? 'cursor-move' : 'cursor-default'} ${isDragging ? 'z-50' : ''} ${isOver ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''} min-h-[200px] flex flex-col ${isDragging ? '' : 'transition-all duration-200'}`}
      {...(canDrag ? { ...attributes, ...listeners } : {})}
      style={{
        ...style,
        touchAction: canDrag ? 'none' : 'auto',
        userSelect: isDragging ? 'none' : 'auto',
        WebkitUserSelect: isDragging ? 'none' : 'auto',
      }}
      data-draggable={canDrag}
      data-dragging={isDragging}
    >
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              style={{
                backgroundColor: badgeColor,
                color: 'white',
                borderColor: badgeColor
              }}
            >
              {table.categories?.[card.categoryId]?.title || card.categoryId}
            </Badge>
            {card.isAnonymous && table.status === 'active' && <EyeOff className="h-4 w-4 text-muted-foreground" />}
            {canDrag && (
              <div 
                className="p-1 rounded hover:bg-accent transition-colors"
                style={{ touchAction: 'none' }}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onVote(card.id)
              }}
              className={`h-8 w-8 p-0 ${card.isVotedByMe ? 'text-primary' : ''}`}
              style={{ touchAction: 'manipulation' }}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[20px]">{card.votes}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className={`space-y-3 flex-1 ${blurred ? 'blur-sm select-none' : ''}`}>
          {contentParts.map((part, index) => (
            <div key={index} className="flex-1">
              <p className="text-sm leading-relaxed break-words overflow-wrap-anywhere hyphens-auto">{part}</p>
              {index < contentParts.length - 1 && (
                <div className="w-full h-px bg-border my-3" />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 flex-shrink-0">
          <span>{card.isAnonymous ? 'Anonymous' : card.authorName}</span>
          <span>{new Date(card.createdAt).toLocaleTimeString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function TableViewContent(): JSX.Element {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tableId = params.id as string
  const socket = useSocket()
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
  const [cardsBlurred, setCardsBlurred] = useState(true) // Default to blurred
  const [isArchiving, setIsArchiving] = useState(false)
  const [votingCardId, setVotingCardId] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [displayMode, setDisplayMode] = useState<'list' | 'grid' | 'rows'>('list')
  const [sortBy, setSortBy] = useState<'votes' | 'date' | 'author'>('votes')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Ref to store current table state for socket events
  const tableRef = useRef<RetroTable | null>(null)

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

  // Auto-show cards when table is archived
  useEffect(() => {
    if (table?.status === 'archived') {
      setCardsBlurred(false)
    }
  }, [table?.status])

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
    // Update ref when table changes
    tableRef.current = table
  }, [table])

  // Socket.IO event listeners for real-time updates
  const listenersSetupRef = useRef(false)
  
  useEffect(() => {
    if (!socket || !tableId || listenersSetupRef.current || !socket.isConnected) {
      console.log('Socket setup skipped:', { 
        hasSocket: !!socket, 
        tableId, 
        listenersSetup: listenersSetupRef.current, 
        isConnected: socket?.isConnected 
      })
      return
    }

    console.log('Setting up socket event listeners for table:', tableId)
    listenersSetupRef.current = true

    // Join the table room
    socket.joinRoom(tableId)
    console.log('Attempted to join room:', tableId)

    // Send a debug event to test the connection
    setTimeout(() => {
      if (socket) {
        console.log('Sending debug event to test connection')
        socket.emit('debug', { tableId, message: 'Frontend connected' })
      }
    }, 1000)

    // Listen for room join confirmation
    const handleRoomJoined = (data: any) => {
      console.log('Successfully joined room:', data)
    }

    // Listen for card events
    const handleCardCreated = (data: any) => {
      console.log('Received card-created event:', data)
      if (data.tableId === tableId && data.card) {
        console.log('Adding card to state:', data.card)
        setCards(prev => [...prev, data.card])
      } else {
        console.log('Card event ignored - tableId mismatch or missing card data')
      }
    }

    const handleCardUpdated = (data: any) => {
      console.log('Received card-updated event:', data)
      if (data.tableId === tableId && data.card) {
        setCards(prev => prev.map(card => 
          card.id === data.card.id ? data.card : card
        ))
      }
    }

    const handleCardDeleted = (data: any) => {
      console.log('Received card-deleted event:', data)
      if (data.tableId === tableId && data.cardId) {
        setCards(prev => prev.filter(card => card.id !== data.cardId))
      }
    }

    const handleCardsMerged = (data: any) => {
      console.log('Received cards-merged event:', data)
      if (data.tableId === tableId && data.mergedCard) {
        setCards(prev => prev.map(card => 
          card.id === data.mergedCard.id ? data.mergedCard : card
        ).filter(card => card.id !== data.draggedCardId))
      }
    }

    const handleCardVoted = (data: any) => {
      console.log('Received card-voted event:', data)
      if (data.tableId === tableId && data.cardId) {
        setCards(prev => prev.map(card => 
          card.id === data.cardId ? { ...card, votes: data.votes, isVotedByMe: data.isVotedByMe } : card
        ))
      }
    }

    const handleTopicAdded = (data: any) => {
      if (data.tableId === tableId && data.topic) {
        setTable(prev => prev ? {
          ...prev,
          categories: {
            ...(prev.categories || {}),
            [data.topic.key]: { title: data.topic.title, color: data.topic.color }
          }
        } : null)
      }
    }

    const handleTopicUpdated = (data: any) => {
      if (data.tableId === tableId && data.topic) {
        setTable(prev => prev ? {
          ...prev,
          categories: {
            ...(prev.categories || {}),
            [data.topic.key]: { title: data.topic.title, color: data.topic.color }
          }
        } : null)
      }
    }

    const handleTopicRemoved = (data: any) => {
      if (data.tableId === tableId && data.topicKey) {
        setTable(prev => prev ? {
          ...prev,
          categories: Object.fromEntries(
            Object.entries(prev.categories || {}).filter(([key]) => key !== data.topicKey)
          )
        } : null)
        
        // Remove all cards from the deleted topic
        setCards(prev => prev.filter(card => card.categoryId !== data.topicKey))
      }
    }

    const handleTableArchived = (data: any) => {
      if (data.tableId === tableId) {
        setTable(prev => prev ? { ...prev, status: 'archived' as const } : null)
        setCardsBlurred(false) // Show cards when archived
      }
    }

    const handleBlurToggled = (data: any) => {
      if (data.tableId === tableId) {
        setCardsBlurred(data.blurred)
      }
    }

    // Add event listeners
    socket.on('room-joined', handleRoomJoined)
    socket.on('card-created', handleCardCreated)
    socket.on('card-updated', handleCardUpdated)
    socket.on('card-deleted', handleCardDeleted)
    socket.on('cards-merged', handleCardsMerged)
    socket.on('card-voted', handleCardVoted)
    socket.on('topic-added', handleTopicAdded)
    socket.on('topic-updated', handleTopicUpdated)
    socket.on('topic-removed', handleTopicRemoved)
    socket.on('table-archived', handleTableArchived)
    socket.on('blur-toggled', handleBlurToggled)

    // Cleanup function
    return () => {
      console.log('Cleaning up socket event listeners for table:', tableId)
      listenersSetupRef.current = false
      socket.leaveRoom(tableId)
      socket.off('room-joined')
      socket.off('card-created')
      socket.off('card-updated')
      socket.off('card-deleted')
      socket.off('cards-merged')
      socket.off('card-voted')
      socket.off('topic-added')
      socket.off('topic-updated')
      socket.off('topic-removed')
      socket.off('table-archived')
      socket.off('blur-toggled')
    }
  }, [socket?.isConnected, tableId]) // Only depend on connection status and tableId

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
        // Immediately update local state for the creator
        setCards(prev => [...prev, result])
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
      
      if (result) {
        // Immediately update local state for the voter
        setCards(prev => prev.map(c => 
          c.id === cardId ? { 
            ...c, 
            votes: action === 'vote' ? c.votes + 1 : c.votes - 1,
            isVotedByMe: action === 'vote'
          } : c
        ))
      }
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
        // Immediately update local state for the deleter
        setCards(prev => prev.filter(card => card.id !== cardId))
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
        // Immediately update local state for the creator
        setTable(prev => prev ? {
          ...prev,
          categories: {
            ...(prev.categories || {}),
            [result.id]: { title: result.title, color: result.color }
          }
        } : null)
        
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
        // Immediately update local state for the creator
        setTable(prev => prev ? {
          ...prev,
          categories: Object.fromEntries(
            Object.entries(prev.categories || {}).filter(([key]) => key !== topicKey)
          )
        } : null)
        
        // Remove all cards from the deleted topic
        setCards(prev => prev.filter(card => card.categoryId !== topicKey))
        
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
        // Update local state with the merged card
        setCards(prev => prev.map(card => 
          card.id === targetCard.id ? result.mergedCard : card
        ).filter(card => card.id !== draggedCard.id))
        
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
        
        // Emit socket event for real-time updates
        if (socket) {
          socket.emit('archive-table', { tableId })
        }
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
        
        // Emit socket event for real-time updates
        if (socket) {
          socket.emit('share-table', { tableId, email, message })
        }
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

  // Mobile detection hook
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Determine effective display mode (auto-switch to rows on mobile for grid mode)
  const effectiveDisplayMode = displayMode === 'grid' && isMobile ? 'rows' : displayMode

  // Debug modal state
  useEffect(() => {
    console.log('showTopicManager changed:', showTopicManager)
  }, [showTopicManager])

  const isFormValid = newTopic.title.trim().length > 0

  // Check if topic name is duplicate
  const isTopicNameDuplicate = Boolean(table && newTopic.title.trim() && 
    Object.values(table.categories).some(cat => 
      cat.title.toLowerCase() === newTopic.title.trim().toLowerCase()
    ))

  const isTopicFormValid = newTopic.title.trim().length > 0 && !isTopicNameDuplicate

  // Helper function to get hex color from Tailwind class
  const getColorFromClass = (colorClass: string): string => {
    // If it's already a hex color, return it directly
    if (colorClass.startsWith('#')) {
      return colorClass
    }
    
    const colorMap: Record<string, string> = {
      'bg-red-500': '#EF4444',
      'bg-orange-500': '#F97316',
      'bg-yellow-500': '#EAB308',
      'bg-green-500': '#22C55E',
      'bg-teal-500': '#14B8A6',
      'bg-blue-500': '#3B82F6',
      'bg-indigo-500': '#6366F1',
      'bg-purple-500': '#A855F7',
      'bg-pink-500': '#EC4899',
      'bg-rose-500': '#F43F5E',
      'bg-slate-500': '#64748B',
      'bg-gray-500': '#6B7280'
    }

    // Handle custom colors with bg-[#hex] format
    if (colorClass.startsWith('bg-[#') && colorClass.includes(']')) {
      const hexMatch = colorClass.match(/#[0-9A-Fa-f]{6}/)
      return hexMatch?.[0] || '#6B7280'
    }

    // Handle predefined colors
    for (const [className, hexColor] of Object.entries(colorMap)) {
      if (colorClass.includes(className)) {
        return hexColor
      }
    }

    return '#6B7280' // fallback
  }

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
                  onClick={() => setCardsBlurred(!cardsBlurred)}
                  className="flex items-center gap-2"
                >
                  {cardsBlurred ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {cardsBlurred ? 'Show Cards' : 'Hide Cards'}
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

      {/* Category Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {/* All Topics Tab */}
          <Button
            variant={activeCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory('all')}
            className="flex items-center gap-2"
          >
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            All Topics
            <Badge variant="secondary" className="ml-1">
              {cards.length}
            </Badge>
          </Button>
          
          {/* Individual Topic Tabs */}
          {table.categories && Object.entries(table.categories).map(([key, category]) => (
            <Button
              key={key}
              variant={activeCategory === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(key)}
              className="flex items-center gap-2"
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: getColorFromClass(category.color)
                }}
              ></div>
              {category.title}
              <Badge variant="secondary" className="ml-1">
                {cards.filter(card => card.categoryId === key).length}
              </Badge>
              {isOwner && table.status === 'active' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveTopic(key)
                  }}
                  className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                >
                  ×
                </Button>
              )}
            </Button>
          ))}
          
          {/* Add Topic Button for Owner */}
          {isOwner && table.status === 'active' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('Add Topic button clicked, setting showTopicManager to true')
                setShowTopicManager(true)
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-3 w-3" />
              Add Topic
            </Button>
          )}
        </div>
      </div>



      {/* Add Card Section */}
      {table.status === 'active' && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Card
            </CardTitle>
            <CardDescription>
              Share your thoughts for the {activeCategory === 'all' ? 'selected' : table.categories?.[activeCategory]?.title || 'selected'} category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Textarea
                    placeholder="Enter your feedback..."
                    value={newCard.content}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewCard(prev => ({ ...prev, content: e.target.value }))}
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={showAnonymous}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowAnonymous(e.target.checked)}
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
                  {table.categories && Object.entries(table.categories).map(([key, category]) => (
                    <Button
                      key={key}
                      variant={newCard.categoryId === key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewCard(prev => ({ ...prev, categoryId: key }))}
                      style={newCard.categoryId === key ? {
                        backgroundColor: getColorFromClass(category.color),
                        borderColor: getColorFromClass(category.color),
                        color: 'white'
                      } : {}}
                    >
                      {category.title}
                    </Button>
                  ))}
                </div>
                <Button onClick={handleAddCard} disabled={!newCard.content.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  Add Card
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Display:</span>
          <div className="flex items-center gap-1">
            <Button
              variant={displayMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDisplayMode('list')}
              className="h-8 px-3"
              title="List view"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={displayMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDisplayMode('grid')}
              className="h-8 px-3"
              title="Grid view (columns by topic)"
            >
              <Grid3X3 className="h-4 w-4" />
              {displayMode === 'grid' && isMobile && (
                <Badge variant="secondary" className="ml-1 text-xs">→ rows</Badge>
              )}
            </Button>
            <Button
              variant={displayMode === 'rows' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDisplayMode('rows')}
              className="h-8 px-3"
              title="Rows with icons"
            >
              <Rows className="h-4 w-4" />
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
              variant={sortBy === 'votes' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('votes')}
              className="h-8 px-3"
              title="Sort by votes"
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Votes
            </Button>
            <Button
              variant={sortBy === 'date' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('date')}
              className="h-8 px-3"
              title="Sort by date"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Date
            </Button>
            <Button
              variant={sortBy === 'author' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('author')}
              className="h-8 px-3"
              title="Sort by author"
            >
              <User className="h-4 w-4 mr-1" />
              Author
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-8 px-3"
              title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

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
          // Grid view: Cards organized by topic columns
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {table.categories && Object.entries(table.categories).map(([categoryKey, category]) => {
              const categoryCards = filteredCards.filter(card => card.categoryId === categoryKey)
              return (
                <div key={categoryKey} className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getColorFromClass(category.color) }}
                    />
                    <h3 className="font-semibold">{category.title}</h3>
                    <Badge variant="secondary">{categoryCards.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {categoryCards.map((card) => (
                      <DraggableCard
                        key={card.id}
                        card={card}
                        table={table}
                        onVote={handleVote}
                        onDelete={handleDeleteCard}
                        blurred={cardsBlurred}
                        canDrag={table.status === 'active' && isOwner}
                        getColorFromClass={getColorFromClass}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : effectiveDisplayMode === 'rows' ? (
          // Rows view: Cards in rows with topic icons
          <div className="space-y-3">
            {filteredCards.map((card) => (
              <div key={card.id} className="flex items-start gap-3 p-4 bg-card border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex-shrink-0">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ 
                      backgroundColor: getColorFromClass(table.categories?.[card.categoryId]?.color || '#6B7280') 
                    }}
                  >
                    {table.categories?.[card.categoryId]?.title?.charAt(0) || '?'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className={`text-sm break-words ${cardsBlurred ? 'blur-sm select-none' : ''}`}>
                      {card.content}
                    </p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {table.status === 'active' && (
                        <button
                          onClick={() => handleVote(card.id)}
                          disabled={votingCardId === card.id}
                          className="p-1 hover:bg-accent rounded text-xs flex items-center gap-1"
                          title="Vote"
                        >
                          <ThumbsUp className="h-3 w-3" />
                          {card.votes}
                        </button>
                      )}
                      {isOwner && table.status === 'active' && (
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-1 hover:bg-destructive/10 text-destructive rounded text-xs"
                          title="Delete card"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>by {card.isAnonymous ? 'Anonymous' : card.authorName}</span>
                    <span>{new Date(card.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List view: Default grid layout
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {filteredCards.map((card) => (
              <DraggableCard
                key={card.id}
                card={card}
                table={table}
                onVote={handleVote}
                onDelete={handleDeleteCard}
                blurred={cardsBlurred}
                canDrag={table.status === 'active' && isOwner}
                getColorFromClass={getColorFromClass}
              />
            ))}
          </div>
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
                <p className={`text-sm mb-3 break-words overflow-wrap-anywhere hyphens-auto ${cardsBlurred ? 'blur-sm select-none' : ''}`}>
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