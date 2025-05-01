import ProductsManagement from "./products-management"

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic'
// Add revalidation to ensure fresh data
export const revalidate = 0

export default function AdminProductsPage() {
  return <ProductsManagement />
}
