// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic'
// Add revalidation to ensure fresh data
export const revalidate = 0

import DashboardClient from './dashboard-client'

// This is a server component that renders the client component
export default function DashboardPage() {
  return <DashboardClient />
}