import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable static optimization for routes that need to be dynamic
  experimental: {
    // This helps with cookie-based authentication
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Configure ESLint to not fail the build
  eslint: {
    // Warning instead of error during build
    ignoreDuringBuilds: true,
  },

  // Configure TypeScript to not fail the build
  typescript: {
    // Warning instead of error during build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
