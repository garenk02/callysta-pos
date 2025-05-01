import { UserRole } from '@/types'

// Define route access rules
export const routeAccessRules: Record<string, UserRole[]> = {
  '/users': ['admin'],
  '/settings': ['admin'],
  '/admin/products': ['admin'],
  '/products': ['admin', 'cashier'], // Customer-facing products page
  '/orders': ['admin', 'cashier'],
  '/checkout': ['admin', 'cashier'],
  '/dashboard': ['admin', 'cashier'],
  '/': ['admin', 'cashier'],
}

/**
 * Check if a user with the given role has access to a specific route
 * @param role The user's role
 * @param path The path to check access for
 * @returns boolean indicating if the user has access
 */
export function hasRouteAccess(role: UserRole, path: string): boolean {
  // Check exact path match first
  if (routeAccessRules[path] && routeAccessRules[path].includes(role)) {
    return true
  }

  // Check for parent path match (e.g., /products/123 should match /products rule)
  for (const [route, allowedRoles] of Object.entries(routeAccessRules)) {
    if (path.startsWith(`${route}/`) && allowedRoles.includes(role)) {
      return true
    }
  }

  // Default to no access if no matching rule found
  return false
}

/**
 * Get all routes that a user with the given role has access to
 * @param role The user's role
 * @returns Array of routes the user can access
 */
export function getAccessibleRoutes(role: UserRole): string[] {
  return Object.entries(routeAccessRules)
    .filter(([_, allowedRoles]) => allowedRoles.includes(role))
    .map(([route]) => route)
}
