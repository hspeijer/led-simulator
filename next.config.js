/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  webpack: (config, { dev, isServer }) => {
    // Enable source maps in development
    if (dev && !isServer) {
      config.devtool = 'eval-source-map';
    }
    
    // Enable source maps in production
    if (!dev && !isServer) {
      config.devtool = 'source-map';
    }
    
    return config;
  },
}

module.exports = nextConfig

