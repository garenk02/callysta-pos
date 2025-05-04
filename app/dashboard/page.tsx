// app/dashboard/page.tsx

// Set revalidation time to 5 minutes
export const revalidate = 300;

import DashboardClient from './dashboard-client';

export default function Dashboard() {
  return <DashboardClient />;
}
