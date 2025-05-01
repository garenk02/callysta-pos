import React from "react";
import Link from "next/link";

export default function Logo() {
  return (
    <div className="h-16 flex items-center px-6 border-b border-border">
      <Link href="/" className="flex items-center">
        <span className="text-xl font-bold text-primary">EasyFlow</span>
        <span className="text-xl font-bold ml-1">POS</span>
      </Link>
    </div>
  );
}