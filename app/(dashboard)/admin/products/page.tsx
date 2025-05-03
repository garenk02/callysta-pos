// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic'
// Add revalidation to ensure fresh data
export const revalidate = 0

import ProductsWrapper from './products-wrapper'

export default function AdminProductsPage() {
  return <ProductsWrapper />
}
