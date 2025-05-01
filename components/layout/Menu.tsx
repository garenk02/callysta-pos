'use client'

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  Users,
  Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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
    roles: ['admin']
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
    href: "/orders",
    roles: ['admin', 'cashier']
  },
  {
    name: "Users",
    icon: Users,
    href: "/users",
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

  return (
    <nav className="flex-1 py-4">
      <ul className="space-y-1">
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center px-6 py-3 text-sm font-medium rounded-md
                  ${isActive
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-secondary/50 hover:text-primary'
                  }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
