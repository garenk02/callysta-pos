import { Metadata } from "next"
import OrdersManagement from "./orders-management"
import ProtectedRoute from "@/components/auth/ProtectedRoute"

export const metadata: Metadata = {
  title: "Order History",
  description: "View and manage order history",
}

export default function OrdersPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <OrdersManagement />
    </ProtectedRoute>
  )
}
