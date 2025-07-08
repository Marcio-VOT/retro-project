"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'

export default function LoginPage(): JSX.Element {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isLoading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  // Get invite token and table ID from URL
  const inviteToken = searchParams.get('invite')
  const tableId = searchParams.get('tableId')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await login(email, password)
      
      // Redirect based on whether we have an invite token
      if (inviteToken && tableId) {
        // Redirect to the table with the invite token
        router.push(`/table/${tableId}?invite=${inviteToken}`)
        toast.success('Welcome back! Redirecting to your invited table.')
      } else {
        // Normal redirect to home
        router.push('/home')
      }
    } catch (error) {
      setError('Invalid email or password')
    }
  }

  // Update register link to include invite token if present
  const getRegisterLink = () => {
    if (inviteToken && tableId) {
      return `/auth/register?invite=${inviteToken}&tableId=${tableId}`
    }
    return '/auth/register'
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Sign in</CardTitle>
          <CardDescription className="text-center">
            {inviteToken 
              ? 'Sign in to access your invited retrospective'
              : 'Enter your email and password to access your account'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            Don't have an account?{' '}
            <Link href={getRegisterLink()} className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 