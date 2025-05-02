/** @type {import('next').NextConfig} */
const nextConfig = {
  api: {
    bodyParser: false,
    responseLimit: '10mb',
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig 