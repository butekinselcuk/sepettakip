/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Dosya taramalarını belirli klasörlerle sınırla
    config.watchOptions = {
      ignored: [
        '**/node_modules',
        '**/Application Data/**',
        '**/AppData/**',
        '**/.next/**'
      ],
    };
    
    // EPERM hatalarını önlemek için ek yapılandırma
    if (isServer) {
      config.externals = [...(config.externals || []), 'Application Data'];
    }
    
    return config;
  },
  // Dosya sistemi taramalarını sınırla
  onDemandEntries: {
    // Sayfaları bellekte ne kadar süre tutulacağı (ms)
    maxInactiveAge: 25 * 1000,
    // Aynı anda bellekte kaç sayfa tutulacağı
    pagesBufferLength: 2,
  },
  // Harici klasörleri belirtildiğinde yoksay
  experimental: {
    outputFileTracingIgnores: ['**Application Data**', '**AppData**'],
  },
}

export default nextConfig; 