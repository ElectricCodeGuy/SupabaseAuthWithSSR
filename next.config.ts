import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180
    },
    globalNotFound: true,
    appNewScrollHandler: true
  },
  logging: {
    browserToTerminal: true
  },
  poweredByHeader: false
};
export default nextConfig;
