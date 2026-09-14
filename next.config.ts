import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Prevents duplicate double-render in dev
  experimental: {
    optimizePackageImports: [
      '@heroui/react',
      'lucide-react',
      'framer-motion',
    ],
  },
  images: {
    unoptimized: true, // Loads images instantly without waiting for server-side optimization
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "7731",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "7731",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
