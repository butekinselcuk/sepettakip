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
      'migros.com.tr',
      'images.unsplash.com', 
      'via.placeholder.com', 
      'randomuser.me'
    ],
  },

  // Environment variables that will be available on the client
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    // Ortam değişkenlerini doğrudan buraya ekleyelim (geçici çözüm)
    JWT_SECRET: "3a82c5a4c69f45b3a3fb62e6ebdc6ea4982c5a4c69f45b3a3fb62e6ebdc6ea4",
    NEXTAUTH_SECRET: "3a82c5a4c69f45b3a3fb62e6ebdc6ea4982c5a4c69f45b3a3fb62e6ebdc6ea4",
    NEXTAUTH_URL: "http://localhost:3001"
  },

  // Sayfa yönlendirmeleri
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: true,
      },
      {
        source: '/business',
        destination: '/business/dashboard',
        permanent: true,
      },
      {
        source: '/courier',
        destination: '/courier/dashboard',
        permanent: true,
      },
      {
        source: '/customer',
        destination: '/customer/dashboard',
        permanent: true,
      }
    ]
  },

  // Enable experimental features
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001'],
    },
  },
  
  // External packages for server components (güncellenmiş yapı)
  serverExternalPackages: ['prisma', '@prisma/client'],
  
  // ESLint ve TypeScript hatalarını derleme sırasında görmezden gel
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // URL yapılandırması ile ilgili sorunları çözmek için
  skipMiddlewareUrlNormalize: true,
  skipTrailingSlashRedirect: true,
  
  // Transpile edilecek modüller - native modüller için gerekli
  transpilePackages: [
    'leaflet', 
    'react-leaflet',
    'xlsx',
    'bcrypt',
    'bcryptjs',
    '@mapbox/node-pre-gyp',
    'node-pre-gyp'
  ],

  // Native modülleri webpack işleminden dışla
  webpack: (config, { isServer }) => {
    // Native modül sorunlarını çözmek için
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
      crypto: false,
      stream: false,
      http: false,
      https: false,
      zlib: false,
      child_process: false,
    };

    // Problematic modules resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      // Explicitly ignore problematic modules
      '@mapbox/node-pre-gyp': false
    };

    // Exclude problematic node_modules from being processed
    config.module.rules.push({
      test: /node_modules\/@mapbox\/node-pre-gyp\/.*$/,
      loader: 'ignore-loader',
    });

    // Ignore HTML files that might be causing parse errors
    config.module.rules.push({
      test: /\.html$/,
      loader: 'ignore-loader',
    });
    
    // Exclude problematic folders like 'Application Data'
    config.watchOptions = {
      ...config.watchOptions,
      ignored: '**/node_modules/**',
    };

    return config;
  },
}

module.exports = nextConfig 