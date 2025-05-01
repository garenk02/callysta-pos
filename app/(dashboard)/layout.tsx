'use client'

import RootLayout from "@/components/layout/RootLayout";
import { AuthProvider } from "@/hooks/useAuth";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { CartProvider } from "@/components/providers/CartProvider";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <CartProvider>
        <RootLayout>{children}</RootLayout>
        <ToastProvider />
      </CartProvider>
    </AuthProvider>
  );
}
