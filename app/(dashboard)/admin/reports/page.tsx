import { Metadata } from "next"
import ReportsManagement from "./reports-management"
import ProtectedRoute from "@/components/auth/ProtectedRoute"

export const metadata: Metadata = {
  title: "Reports",
  description: "View sales and inventory reports",
}

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic'
// Add revalidation to ensure fresh data
export const revalidate = 0

export default function ReportsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <ReportsManagement />
    </ProtectedRoute>
  )
}
