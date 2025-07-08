"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, MessageSquare, TrendingUp, Shield, Zap, Globe } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

export default function LandingPage(): JSX.Element {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    console.log('Landing page - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading)
    if (!isLoading && isAuthenticated) {
      router.push('/home')
    }
  }, [isAuthenticated, isLoading, router])

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

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Professional Retrospectives
          <span className="text-primary block">Made Simple</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Empower your development team with real-time collaboration, anonymous feedback, 
          and actionable insights from your retrospectives.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/register">
            <Button size="lg" className="text-lg px-8 py-6">
              Get Started Free
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              Sign In
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Retro Project?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8">
                <div className="mb-4 flex justify-center">
                  <div className="p-4 rounded-xl bg-primary/10 text-primary">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Ready to Transform Your Team?</CardTitle>
            <CardDescription>
              Join thousands of development teams who have improved their processes with Retro Project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/register">
              <Button size="lg" className="w-full sm:w-auto">
                Start Your First Retrospective
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 