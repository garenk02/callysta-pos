
import { redirect } from 'next/navigation';

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
// Add revalidation to ensure fresh data
export const revalidate = 0;

export default function Home() {
  // Redirect all users to dashboard
  redirect('/dashboard');
}
