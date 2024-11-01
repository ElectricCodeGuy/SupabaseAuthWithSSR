import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'source.unsplash.com' }]
  },
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180
    }
  },
  async rewrites() {
    return [
      {
        source: '/auth',
        destination: '/auth/signin'
      },
      {
        source: '/aichat',
        destination: '/aichat/1'
      }
    ];
  }
};
export default nextConfig;
