'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signup } from '@/app/login/actions'
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
import { Lock, Mail, User, AlertCircle, Loader2 } from 'lucide-react'
import { usePublicSettings } from '@/hooks/usePublicSettings'
import AuthHead from '@/components/auth/AuthHead'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordsMatch, setPasswordsMatch] = useState(true)
  const [loading, setLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { settings } = usePublicSettings()

  // Check if passwords match whenever either password field changes
  useEffect(() => {
    if (confirmPassword) {
      setPasswordsMatch(password === confirmPassword)
    } else {
      setPasswordsMatch(true) // Don't show error when confirm field is empty
    }
  }, [password, confirmPassword])

  // Debug logging for settings and update document title
  useEffect(() => {
    // console.log('Signup page public settings:', settings)

    // Update document title directly
    if (settings?.app_name) {
      document.title = `Sign Up - ${settings.app_name}`
      // console.log('Updated document title to:', document.title)
    }
  }, [settings])

  // No longer needed as we're redirecting directly in the form submission handler

  return (
    <div className="flex items-center justify-center min-h-screen bg-background relative">
      {/* Add AuthHead component to update document title */}
      <AuthHead pageType="signup" />

      {/* Loading overlay */}
      {(loading || redirecting) && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {redirecting
                ? "Account created! Redirecting to login page..."
                : "Creating your account..."}
            </p>
          </div>
        </div>
      )}

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
            Create a new account
          </CardDescription>
        </CardHeader>
        <form action={async (formData) => {
          // Client-side validation
          if (!passwordsMatch) {
            setError('Passwords do not match')
            return
          }

          setLoading(true)
          setError(null)
          setSuccess(false)

          try {
            console.log('Submitting signup form...')
            const { error: signupError } = await signup(formData)

            if (signupError) {
              console.error('Signup error in component:', signupError)
              setError(signupError.message)
              return
            }

            // Show success message and immediately redirect
            console.log('Signup successful in component, redirecting to login')
            setSuccess(true)

            // Change loading state to redirecting
            setRedirecting(true)

            // Clear form fields
            setName('')
            setEmail('')
            setPassword('')
            setConfirmPassword('')

            // Directly redirect to login page after a short delay
            setTimeout(() => {
              console.log('Executing redirect to /login')
              router.push('/login')
              // Note: We don't set loading to false here, as we want the loading state
              // to persist during the redirect to the login page
            }, 1500)
          } catch (err: any) {
            console.error('Unexpected error in signup component:', err)
            setError(err.message || 'Failed to sign up')
            setLoading(false)
          }
        }}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 text-sm bg-green-100 text-green-800 rounded-md flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Account created successfully! Redirecting to login page...</span>
              </div>
            )}

            {/* Name field */}
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Email field */}
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

            {/* Password field */}
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

            {/* Confirm Password field */}
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-type Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-10 ${!passwordsMatch ? 'border-destructive' : ''}`}
                  required
                />
              </div>
              {!passwordsMatch && (
                <p className="text-xs text-destructive ml-1">Passwords do not match</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !name || !email || !password || !confirmPassword || !passwordsMatch}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : 'Create Account'}
            </Button>

            <div className="text-center text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
