'use client'

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  Users,
  Settings,
  BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/hooks/useSidebar";
import { UserRole } from "@/types";

// Define menu items with role-based access
const menuItems = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
    roles: ['admin', 'cashier']
  },
  {
    name: "Products",
    icon: Package,
    href: "/admin/products",
    roles: ['admin', 'cashier']
  },
  {
    name: "Checkout",
    icon: ShoppingCart,
    href: "/checkout",
    roles: ['admin', 'cashier']
  },
  {
    name: "Orders",
    icon: ClipboardList,
    href: "/admin/orders",
    roles: ['admin']
  },
  {
    name: "Users",
    icon: Users,
    href: "/users",
    roles: ['admin']
  },
  {
    name: "Reports",
    icon: BarChart3,
    href: "/admin/reports",
    roles: ['admin']
  },
  {
    name: "Settings",
    icon: Settings,
    href: "/settings",
    roles: ['admin']
  },
];

export default function Menu() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => {
    if (isLoading) return false;
    if (!user) return false;
    return item.roles.includes(user.role as UserRole);
  });

  const { isExpanded } = useSidebar();
  const [hydrated, setHydrated] = useState(false);

  // Mark component as hydrated after client-side hydration is complete
  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <nav className="flex-1 py-4 relative z-50">
      <ul className="space-y-1">
        {filteredMenuItems.map((item) => {
          // Special case for Dashboard: active when on / or /dashboard
          const isDashboard = item.href === "/" && item.name === "Dashboard";
          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`) ||
            (isDashboard && pathname === "/dashboard");

          // Always use expanded style during SSR and hydration
          const itemPadding = !hydrated || isExpanded ? 'px-6' : 'px-0 justify-center';
          const iconMargin = !hydrated || isExpanded ? 'mr-3' : 'mx-auto';

          return (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center ${itemPadding} py-3 text-sm font-medium rounded-md
                  ${isActive
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-secondary/50 hover:text-primary'
                  } transition-all duration-300 relative z-50`}
                title={!hydrated || !isExpanded ? item.name : undefined}
                onClick={(e) => {
                  // Prevent event propagation to ensure the click isn't captured by the overlay
                  e.stopPropagation();
                }}
              >
                <item.icon className={`h-5 w-5 ${iconMargin}`} />
                {(!hydrated || isExpanded) && item.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
