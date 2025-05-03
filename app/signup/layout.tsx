import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { getAppName } from "@/lib/supabase/server-settings";
import HydrationFix from "@/components/HydrationFix";
import { Toaster } from "sonner";

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  // Get app name from Supabase
  const appName = await getAppName();

  return {
    title: `Sign Up - ${appName}`,
    description: `Create a new ${appName} account`,
  };
}

export default function SignupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable}`}>
      <HydrationFix>
        {children}
        <Toaster position="top-right" />
      </HydrationFix>
    </div>
  );
}

