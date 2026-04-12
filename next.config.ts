import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'lh3.googleusercontent.com',  // Google profile photos
      'firebasestorage.googleapis.com',  // Firebase Storage
    ],
  },
  // Suppress hydration warning for theme
  reactStrictMode: true,
};

export default nextConfig;
