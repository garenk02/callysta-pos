// app/dashboard/page.tsx

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
// Add revalidation to ensure fresh data
export const revalidate = 0;

import DashboardClient from './dashboard-client';

export default function Dashboard() {
  return <DashboardClient />;
}
