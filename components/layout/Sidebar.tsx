'use client'

import React, { useEffect, useState } from "react";
import Logo from "./Logo";
import Menu from "./Menu";
import { useSidebar } from "@/hooks/useSidebar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const { isExpanded, toggleSidebar } = useSidebar();
  const [isMounted, setIsMounted] = useState(false);

  // Mark component as mounted after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Use useEffect to log the sidebar state for debugging
  useEffect(() => {
    console.log('Sidebar state:', isExpanded ? 'expanded' : 'collapsed');
  }, [isExpanded]);

  // Add a click handler to the document to close the sidebar on mobile when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only handle this on mobile
      if (window.innerWidth >= 768) return;

      // Check if the sidebar is expanded and the click is outside the sidebar
      if (isExpanded && event.target instanceof Node) {
        const sidebarElement = document.querySelector('aside');
        if (sidebarElement && !sidebarElement.contains(event.target)) {
          toggleSidebar();
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isExpanded, toggleSidebar]);

  // Always render the expanded sidebar on the server and during hydration
  // Only apply collapsed state after client-side hydration is complete
  const sidebarWidth = !isMounted || isExpanded ? 'w-64' : 'w-20';
  const sidebarVisibility = !isMounted || isExpanded ? 'fixed md:relative inset-y-0 z-50' : 'hidden';
  const toggleButtonPosition = !isMounted || isExpanded ? 'left-64' : 'left-20';

  return (
    <>
      <aside
        className={`${sidebarWidth} bg-background border-r border-border flex flex-col
          transition-all duration-300 ease-in-out md:block ${sidebarVisibility}`}
      >
        <Logo />
        <Menu />

        {/* Mobile overlay - rendered outside the aside to avoid positioning issues */}
        {(isExpanded && isMounted) && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={toggleSidebar}
            aria-hidden="true"
          />
        )}
      </aside>

      {/* Toggle button positioned fixed to the sidebar */}
      <div
        className={`fixed top-20 z-50 hidden md:block transition-all duration-300 ${toggleButtonPosition}`}
        style={{ transform: 'translateX(-50%)' }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full border border-border bg-background shadow-sm flex items-center justify-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            // Add a small delay to ensure the event doesn't conflict with navigation
            setTimeout(() => {
              toggleSidebar();
            }, 10);
          }}
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>
    </>
  );
}