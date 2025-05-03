import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider } from '@/hooks/useCart';
import { AuthProvider } from '@/hooks/useAuth';
import { SidebarProvider } from '@/hooks/useSidebar';
import { SettingsProvider } from '@/hooks/useSettings';

// Create a custom render function that includes providers
export function render(ui: React.ReactElement, options = {}) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <AuthProvider>
        <SettingsProvider>
          <SidebarProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </SidebarProvider>
        </SettingsProvider>
      </AuthProvider>
    );
  };

  return {
    user: userEvent.setup(),
    ...rtlRender(ui, { wrapper: Wrapper, ...options }),
  };
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { userEvent };
