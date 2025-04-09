/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      dns: false,
      net: false,
      tls: false,
      pg: false,
      "pg-native": false,
    };
    return config;
  },
};

module.exports = nextConfig;
