import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  typescript: {
    // Strict type checking
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
