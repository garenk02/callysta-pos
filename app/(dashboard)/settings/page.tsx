// Force dynamic rendering to prevent caching issues with cookies
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import SettingsClient from './settings-client';

export default function SettingsPage() {
  return <SettingsClient />;
}
