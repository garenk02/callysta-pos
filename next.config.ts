import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure output mode for better static/dynamic handling
  output: 'standalone',

  // Disable static optimization for routes that need to be dynamic
  experimental: {
    // This helps with cookie-based authentication
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
