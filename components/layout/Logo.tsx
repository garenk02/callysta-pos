'use client'

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSidebar } from "@/hooks/useSidebar";
import { useSettings } from "@/hooks/useSettings";

export default function Logo() {
  const { isExpanded } = useSidebar();
  const { settings } = useSettings();
  const [isMounted, setIsMounted] = useState(false);

  // Mark component as mounted after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Always render the expanded logo on the server and during hydration
  const logoStyle = !isMounted || isExpanded ? 'px-6' : 'px-0 justify-center';

  // Get app name from settings or use default
  const appName = settings?.app_name || 'EasyFlow POS';

  // Split app name into parts (for primary/secondary styling)
  const nameParts = appName.split(' ');
  const primaryPart = nameParts[0];
  const secondaryPart = nameParts.slice(1).join(' ');

  // For collapsed state, use first letter of app name
  const shortName = primaryPart.charAt(0);

  return (
    <div className={`h-16 flex items-center ${logoStyle} border-b border-border transition-all duration-300`}>
      <Link href="/" className="flex items-center">
        {!isMounted || isExpanded ? (
          <>
            <span className="text-xl font-bold text-primary">{primaryPart}</span>
            {secondaryPart && (
              <span className="text-xl font-bold ml-1">{secondaryPart}</span>
            )}
          </>
        ) : (
          <span className="text-xl font-bold text-primary">{shortName}</span>
        )}
      </Link>
    </div>
  );
}