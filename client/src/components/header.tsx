"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuthStore } from '@/stores/auth-store'
import { useGuestStore } from '@/stores/guest-store'
import { LogOut, User } from 'lucide-react'

export function Header(): JSX.Element {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { isGuest, guestUser, clearGuestData } = useGuestStore()

  const handleLogout = () => {
    if (isGuest) {
      clearGuestData()
    } else {
      logout()
    }
    router.push('/')
  }

  // Check if user has any form of access (authenticated or guest)
  const hasAccess = isAuthenticated || isGuest

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-14 items-center justify-between">
        {/* Logo/Home */}
        <div className="flex items-center space-x-4">
          <Link href={hasAccess ? "/home" : "/"} className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">R</span>
            </div>
            <span className="font-bold text-xl">Retro</span>
          </Link>
        </div>

        {/* User Info and Actions */}
        <div className="flex items-center space-x-2">
          {isAuthenticated && user ? (
            <>
              <div className="hidden md:flex items-center space-x-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Welcome,</span>
                <span className="font-medium">{user.name}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : isGuest && guestUser ? (
            <>
              <div className="hidden md:flex items-center space-x-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Guest:</span>
                <span className="font-medium">{guestUser.name}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Exit Guest</span>
              </Button>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
} 