
import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { UserRole } from '@/types'

// Define route access rules
const routeAccessRules: Record<string, UserRole[]> = {
  '/users': ['admin'],
  '/settings': ['admin'],
  '/admin/products': ['admin', 'cashier'], // Both roles can access products management
  '/admin/orders': ['admin'],
  '/admin/reports': ['admin'],
  '/orders': ['admin'],
  '/checkout': ['admin', 'cashier'],
  '/dashboard': ['admin', 'cashier'],
  '/': ['admin', 'cashier'],
}

export async function middleware(request: NextRequest) {
  // Update the session and get the response
  const response = await updateSession(request)

  // Get the pathname from the URL
  const pathname = request.nextUrl.pathname

  // Skip auth check for public routes
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/api')
  ) {
    return response
  }

  // Create a Supabase client using the cookies from the request
  const cookieStore = {
    get(name: string) {
      return request.cookies.get(name)?.value
    },
    set() {}, // We don't need to set cookies in this middleware check
    remove() {}, // We don't need to remove cookies in this middleware check
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieStore }
  )

  try {
    // Check if the user is authenticated using getUser() for better security
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    // If no user or error, redirect to login
    if (userError || !user) {
      console.log('Auth middleware: No authenticated user found')
      const redirectUrl = new URL('/login', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Get user profile with role and active status information
    let profileRole = 'cashier'; // Default role
    let isActive = true; // Default active status

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Auth middleware: Error fetching user profile', profileError)

      // If the profile doesn't exist, create it
      if (profileError.code === 'PGRST116') {
        console.log('Auth middleware: Profile not found, creating a new one')

        try {
          // Create a default profile for the user
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              name: user.email?.split('@')[0] || 'User',
              role: 'cashier',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('role')
            .single()

          if (insertError) {
            console.error('Auth middleware: Error creating user profile:', insertError)
          } else if (newProfile) {
            console.log('Auth middleware: Created new profile with role:', newProfile.role)
            // Use the newly created profile
            profileRole = newProfile.role;
          }
        } catch (insertErr) {
          console.error('Auth middleware: Exception creating profile:', insertErr)
        }
      }
    } else if (profile) {
      profileRole = profile.role;
      isActive = profile.is_active !== false; // If is_active is null or undefined, treat as active
    }

    // Check if the user is active
    if (!isActive) {
      console.log('Auth middleware: User account is deactivated')
      // Sign the user out
      await supabase.auth.signOut()
      // Redirect to login with a message
      const redirectUrl = new URL('/login?error=Account+deactivated', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Use the role we determined
    const userRole = profileRole as UserRole

    // Check if the user has access to the requested route
    for (const [route, allowedRoles] of Object.entries(routeAccessRules)) {
      if (pathname === route || pathname.startsWith(`${route}/`)) {
        // If the route requires specific roles and user doesn't have them, redirect to dashboard
        if (!allowedRoles.includes(userRole)) {
          console.log(`Access denied: User with role ${userRole} tried to access ${pathname}`)
          return NextResponse.redirect(new URL('/', request.url))
        }
        break
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error)
    // On error, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
