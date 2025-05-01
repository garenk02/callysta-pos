'use client'

import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { SidebarProvider } from "@/hooks/useSidebar";
import { SettingsProvider } from "@/hooks/useSettings";
import HydrationFix from "@/components/HydrationFix";
import PageTitle from "@/components/PageTitle";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <HydrationFix>
      <SettingsProvider>
        <SidebarProvider>
          {/* PageTitle component updates document title based on current route */}
          <PageTitle />
          <div className="flex h-screen bg-background relative">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden w-full">
              <Header />
              <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
            </div>
          </div>
        </SidebarProvider>
      </SettingsProvider>
    </HydrationFix>
  );
}