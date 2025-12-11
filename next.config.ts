import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180
    },
    browserDebugInfoInTerminal: true,
    globalNotFound: true
  },
  poweredByHeader: false
};
export default nextConfig;
