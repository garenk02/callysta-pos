'use client'

import RootLayout from "@/components/layout/RootLayout";
import { AuthProvider } from "@/hooks/useAuth";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { CartProvider } from "@/components/providers/CartProvider";
import HydrationFix from "@/components/HydrationFix";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <HydrationFix skipFallback={true}>
      <AuthProvider>
        <CartProvider>
          <RootLayout>{children}</RootLayout>
          <ToastProvider />
        </CartProvider>
      </AuthProvider>
    </HydrationFix>
  );
}
