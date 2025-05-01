'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, UserRole } from '@/types'
import { useRouter, usePathname } from 'next/navigation'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  isCashier: boolean
  checkUserRole: (allowedRoles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
  isCashier: false,
  checkUserRole: () => false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check if user is admin
  const isAdmin = user?.role === 'admin'

  // Check if user is cashier
  const isCashier = user?.role === 'cashier'

  // Function to check if user has one of the allowed roles
  const checkUserRole = (allowedRoles: UserRole[]) => {
    if (!user) return false
    return allowedRoles.includes(user.role)
  }

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true)

      try {
        const supabase = createClient()

        // Use getUser() instead of getSession() for security
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()

        if (userError || !authUser) {
          console.log('No authenticated user found:', userError?.message)
          setUser(null)
          setIsLoading(false)

          // Only redirect if not already on login or signup page
          if (
            pathname !== '/login' &&
            pathname !== '/signup' &&
            !pathname.startsWith('/auth/callback')
          ) {
            router.push('/login')
          }
          return
        }

        console.log('Authenticated user found:', authUser.id)

        // Get user profile with role information
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (profileError) {
          console.error('Error fetching user profile:', profileError)

          // If the profile doesn't exist, create it
          if (profileError.code === 'PGRST116') {
            console.log('Profile not found, creating a new one')

            // Create a default profile for the user
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: authUser.id,
                email: authUser.email,
                name: authUser.email?.split('@')[0] || 'User',
                role: 'cashier',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select('*')
              .single()

            if (insertError) {
              console.error('Error creating user profile:', insertError)
              setUser(null)
            } else {
              console.log('Created new profile:', newProfile)
              // Use the newly created profile
              setUser({
                id: authUser.id,
                email: authUser.email || '',
                role: 'cashier',
                name: newProfile.name,
                avatar_url: newProfile.avatar_url,
                created_at: newProfile.created_at,
                is_active: true
              })
            }
          } else {
            setUser(null)
          }
        } else if (!profile) {
          console.error('Profile not found but no error was returned')
          setUser(null)
        } else {
          console.log('User profile found:', profile.role)
          // Create user object with role
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            role: profile.role || 'cashier', // Default to cashier if no role
            name: profile.name,
            avatar_url: profile.avatar_url,
            created_at: profile.created_at,
            is_active: profile.is_active
          })
        }
      } catch (error) {
        console.error('Auth error:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()

    // Set up auth state change listener
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          fetchUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          router.push('/login')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [pathname, router])

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, isCashier, checkUserRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
