import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/opengen/v1/completions/chat',
        destination: '/api/chat',
      },
    ]
  },
};

export default nextConfig;