'use client'

import React from "react";
import { usePathname } from "next/navigation";
import UserPanel from "./UserPanel";

export default function Header() {
  // Get the current pathname
  const pathname = usePathname();
  
  // Convert pathname to title (e.g., "/dashboard" -> "Dashboard")
  const getPageTitle = () => {
    if (!pathname) return "Dashboard";
    
    const path = pathname.split("/").pop() || "dashboard";
    return path.charAt(0).toUpperCase() + path.slice(1);
  };
  
  return (
    <header className="bg-background border-b border-border h-16 px-6 flex items-center justify-between">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
      </div>
      <UserPanel />
    </header>
  );
}

