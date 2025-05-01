'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { login } from './actions'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AlertCircle, Lock, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { usePublicSettings } from '@/hooks/usePublicSettings'
import AuthHead from '@/components/auth/AuthHead'

function ClientLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { settings } = usePublicSettings()

  // Debug logging for settings and update document title
  useEffect(() => {
    console.log('Login page public settings:', settings)

    // Update document title directly
    if (settings?.app_name) {
      document.title = `Login - ${settings.app_name}`
      console.log('Updated document title to:', document.title)
    }
  }, [settings])

  // Check for error parameters in the URL
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      if (errorParam === 'Account+deactivated') {
        setError('Your account has been deactivated. Please contact an administrator.')
        toast.error('Your account has been deactivated. Please contact an administrator.')
      } else {
        setError(decodeURIComponent(errorParam))
        toast.error(decodeURIComponent(errorParam))
      }
    }
  }, [searchParams])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      {/* Add AuthHead component to update document title */}
      <AuthHead pageType="login" />

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {settings?.app_name ? (
              <>
                <span className="text-primary">{settings.app_name.split(' ')[0]}</span>
                {' ' + settings.app_name.split(' ').slice(1).join(' ')}
              </>
            ) : (
              <>
                <span className="text-primary">Callysta</span> POS
              </>
            )}
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to sign in
          </CardDescription>
        </CardHeader>
        <form action={async (formData) => {
          setLoading(true)
          setError(null) // Clear previous errors
          const result = await login(formData)
          setLoading(false)

          if (result.error) {
            setError(result.error.message)
          } else {
            router.push('/')
            router.refresh()
          }
        }}>
          <CardContent className="space-y-4">
            {loading && (
              <div className="p-3 text-sm bg-primary/10 text-primary rounded-md">
                Signing in...
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-start">
                <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !email || !password}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center text-sm">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return <ClientLogin />
}



