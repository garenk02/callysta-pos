// Force dynamic rendering to prevent caching issues with cookies
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import SignupClientPage from './client-page';

export default function SignupPage() {
  return <SignupClientPage />;
}

