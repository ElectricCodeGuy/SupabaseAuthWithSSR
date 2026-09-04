import type { NextConfig } from 'next';

// Baseline security headers for every response. A script-level Content
// Security Policy is deliberately not set here: Next.js inlines bootstrap
// scripts, so a strict CSP needs per-request nonces via the proxy — a
// separate, larger change. frame-ancestors alone is safe to ship.
const securityHeaders = [
  // Never MIME-sniff (e.g. treat an uploaded file as HTML).
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // The app is never embedded by other sites — blocks clickjacking.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
  },
  // Ignored over plain http (local dev); applied once the site is on https.
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains'
  }
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    turbopackRustReactCompiler: true,
    staleTimes: {
      dynamic: 30,
      static: 180
    },
    appNewScrollHandler: true
  },
  logging: {
    browserToTerminal: true
  },
  poweredByHeader: false,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  }
};
export default nextConfig;
