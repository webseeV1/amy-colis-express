import type { NextConfig } from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  // Fix workspace root detection warning
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Allow images from Supabase, Cloudinary, and data URLs
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
}

export default nextConfig
