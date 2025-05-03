'use client'

import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/components/providers/CartProvider";
import HydrationFix from "@/components/HydrationFix";

// Client components cannot use the revalidate export
// The dynamic setting is handled in the page component

export default function CheckoutLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <HydrationFix>
      <AuthProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </AuthProvider>
    </HydrationFix>
  );
}
