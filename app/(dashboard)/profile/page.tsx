// Force dynamic rendering to prevent caching issues with cookies
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import ProfileClient from './profile-client';

export default function ProfilePage() {
  return <ProfileClient />;
}
