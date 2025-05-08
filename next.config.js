/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static exports for better performance
  output: 'standalone',
  
  // Image domains for external images
  images: {
    domains: [
      'maps.googleapis.com',
      'yemeksepeti.com',
      'getir.com',
      'trendyol.com',
      'migros.com.tr'
    ],
  },

  // Environment variables that will be available on the client
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  },

  // Enable experimental features
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001'],
    },
  },
}

module.exports = nextConfig 