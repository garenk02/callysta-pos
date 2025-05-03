// Force dynamic rendering to prevent caching issues with cookies
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import UsersClient from './users-client';

export default function UsersPage() {
  return <UsersClient />;
}
