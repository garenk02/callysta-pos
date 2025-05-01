'use client'

import React from "react";
import { usePathname } from "next/navigation";
import UserPanel from "./UserPanel";
import { useSidebar } from "@/hooks/useSidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  // Get the current pathname
  const pathname = usePathname();
  const { toggleSidebar, isExpanded } = useSidebar();

  // Convert pathname to title (e.g., "/dashboard" -> "Dashboard")
  const getPageTitle = () => {
    if (!pathname) return "Dashboard";

    // Handle root path
    if (pathname === '/') return 'Dashboard';

    // Get the last part of the path
    const path = pathname.split("/").pop() || "dashboard";

    // Capitalize first letter of each word and replace hyphens with spaces
    return path
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <header className="bg-background border-b border-border h-16 px-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            // Add a small delay to ensure the event doesn't conflict with navigation
            setTimeout(() => {
              toggleSidebar();
            }, 10);
          }}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
      </div>
      <UserPanel />
    </header>
  );
}

