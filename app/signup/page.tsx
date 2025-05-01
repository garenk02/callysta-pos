'use client'

import { useState } from 'react'
import Link from 'next/link'
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
import { Lock, Mail } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            <span className="text-primary">EasyFlow</span> POS
          </CardTitle>
          <CardDescription className="text-center">
            Create a new account
          </CardDescription>
        </CardHeader>
        <form action={async (formData) => {
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

            // Show success message
            console.log('Signup successful in component')
            setSuccess(true)
            setEmail('')
            setPassword('')
          } catch (err: any) {
            console.error('Unexpected error in signup component:', err)
            setError(err.message || 'Failed to sign up')
          } finally {
            setLoading(false)
          }
        }}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 text-sm bg-green-100 text-green-800 rounded-md">
                Account created successfully! Please check your email to verify your account.
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
              {loading ? 'Creating Account...' : 'Create Account'}
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

