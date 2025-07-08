"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Users, MessageSquare, TrendingUp, Shield, Zap, Globe, Clock, User, Trash2 } from 'lucide-react'
import { ProtectedRoute } from '@/components/protected-route'
import { CreateTableModal } from '@/components/create-table-modal'
import { DeleteTableModal } from '@/components/delete-table-modal'
import { useAuthStore } from '@/stores/auth-store'
import { useGuestStore } from '@/stores/guest-store'
import { useGetUserTables, useDeleteTable, useGetTableWithAccess } from '@/hooks/use-api'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface RetroTable {
  id: string
  name: string
  description: string
  createdAt: string
  participantCount: number
  status: 'active' | 'archived'
  isGuestTable?: boolean
}

function HomePageContent(): JSX.Element {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const { isGuest, guestUser, inviteTokens } = useGuestStore()
  const { getUserTables, loading: isLoading, error } = useGetUserTables()
  const { deleteTable, loading: isDeletingTable } = useDeleteTable()
  const { getTableWithAccess } = useGetTableWithAccess()
  const [tables, setTables] = useState<RetroTable[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [tableToDelete, setTableToDelete] = useState<RetroTable | null>(null)

  // Fetch tables from API
  useEffect(() => {
    const fetchTables = async () => {
      if (isAuthenticated && user) {
        try {
          const userTables = await getUserTables()
          if (userTables) {
            setTables(userTables)
          }
        } catch (error) {
          console.error('Failed to fetch tables:', error)
        }
      } else if (isGuest && guestUser) {
        // For guests, fetch tables they have access to
        try {
          const guestTables: RetroTable[] = []
          
          // Fetch each table the guest has access to
          for (const tableId of guestUser.invitedTables) {
            try {
              const result = await getTableWithAccess(tableId)
              if (result?.success && result.accessGranted) {
                guestTables.push({
                  ...result.table,
                  isGuestTable: true
                })
              }
            } catch (error) {
              console.error(`Failed to fetch table ${tableId}:`, error)
            }
          }
          
          setTables(guestTables)
        } catch (error) {
          console.error('Failed to fetch guest tables:', error)
        }
      } else {
        setTables([])
      }
    }

    fetchTables()
  }, [isAuthenticated, user, isGuest, guestUser, getUserTables, getTableWithAccess])

  const handleJoinTable = (tableId: string) => {
    // Navigate to the specific table page
    router.push(`/table/${tableId}`)
  }

  const handleDeleteTable = async () => {
    if (!tableToDelete) return
    
    try {
      const result = await deleteTable(tableToDelete.id)
      if (result) {
        toast.success('Table deleted successfully')
        // Remove the table from the local state
        setTables(prev => prev.filter(table => table.id !== tableToDelete.id))
        setShowDeleteModal(false)
        setTableToDelete(null)
      }
    } catch (error) {
      toast.error('Failed to delete table')
    }
  }

  const openDeleteModal = (table: RetroTable) => {
    setTableToDelete(table)
    setShowDeleteModal(true)
  }

  const features = [
    {
      icon: <Users className="h-6 w-6" />,
      title: "Team Collaboration",
      description: "Real-time collaboration with your team members during retrospectives"
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Anonymous Feedback",
      description: "Share thoughts anonymously to encourage honest feedback"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Progress Tracking",
      description: "Track improvements and action items across multiple retrospectives"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure & Private",
      description: "Your team's data is encrypted and kept private"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Built for speed with real-time updates and instant synchronization"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Cross-Platform",
      description: "Works seamlessly across desktop, tablet, and mobile devices"
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Main Content Section - Content starts at top */}
      <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-3.5rem)]">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome to Retro
                {isGuest && guestUser && (
                  <span className="text-lg font-normal text-muted-foreground ml-2">
                    (Guest: {guestUser.name})
                  </span>
                )}
              </h1>
              <p className="text-muted-foreground">
                {isGuest 
                  ? 'View retrospectives you\'ve been invited to participate in'
                  : 'Manage your retrospectives and team collaboration sessions'
                }
              </p>
            </div>
            {isGuest && (
              <Badge variant="outline" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Guest Mode
              </Badge>
            )}
          </div>
          
          {isGuest && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Guest Participation Mode
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    You can view and participate in retrospectives you've been invited to. 
                    To create your own tables, please create an account.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {isGuest ? 'Your Invited Retrospectives' : 'Your Retrospectives'}
            </h2>
            {!isGuest && (
              <CreateTableModal>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Table
                </Button>
              </CreateTableModal>
            )}
          </div>

          {/* Tables Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-muted rounded w-full mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : tables.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tables.map((table) => (
                <Card 
                  key={table.id} 
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{table.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        {table.isGuestTable && (
                          <Badge variant="secondary" className="text-xs">
                            Guest
                          </Badge>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          table.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {table.status}
                        </span>
                      </div>
                    </div>
                    <CardDescription>{table.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {table.participantCount} participants
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(table.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleJoinTable(table.id)}
                        className="flex-1"
                        variant={table.status === 'active' ? 'default' : 'outline'}
                      >
                        {table.status === 'active' ? 'Join Session' : 'View Archive'}
                      </Button>
                      {!table.isGuestTable && (
                        <Button
                          variant="destructive"
                          onClick={() => openDeleteModal(table)}
                          className="px-3"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-16">
              <CardContent>
                <div className="mb-6">
                  <Users className="h-16 w-16 mx-auto text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  {isGuest ? 'No invited retrospectives' : 'No retrospectives yet'}
                </h3>
                <p className="text-muted-foreground mb-6 text-lg">
                  {isGuest 
                    ? 'You haven\'t been invited to any retrospectives yet. Ask a team member to share an invite link with you.'
                    : 'Create your first retrospective to get started with team collaboration'
                  }
                </p>
                {!isGuest && (
                  <CreateTableModal>
                    <Button size="lg">
                      Create Your First Table
                    </Button>
                  </CreateTableModal>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Features Section - Appears after scrolling */}
      <div className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Retro Project?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-8">
                  <div className="mb-4 flex justify-center">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Table Modal */}
      {tableToDelete && (
        <DeleteTableModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setTableToDelete(null)
          }}
          onConfirm={handleDeleteTable}
          tableName={tableToDelete.name}
          isLoading={isDeletingTable}
        />
      )}
    </div>
  )
}

export default function HomePage(): JSX.Element {
  return (
    <ProtectedRoute>
      <HomePageContent />
    </ProtectedRoute>
  )
} 