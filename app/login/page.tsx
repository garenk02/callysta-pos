'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Lock, Mail } from 'lucide-react'

function ClientLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            <span className="text-primary">EasyFlow</span> POS
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to sign in
          </CardDescription>
        </CardHeader>
        <form action={async (formData) => {
          setLoading(true)
          const result = await login(formData)
          setLoading(false)
          
          if (!result.error) {
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



