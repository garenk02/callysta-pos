'use client'

import RootLayout from "@/components/layout/RootLayout";
import { AuthProvider } from "@/hooks/useAuth";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <RootLayout>{children}</RootLayout>
    </AuthProvider>
  );
}
