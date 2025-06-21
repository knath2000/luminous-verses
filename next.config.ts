import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['api.quran.com', 'verses.quran.com'],
  },
  experimental: {
    optimizePackageImports: [
      '@stackframe/stack',
      'react-window',
      'react-virtualized-auto-sizer',
      'react-window-infinite-loader',
      '@heroicons/react',
      '@headlessui/react',
      '@stackframe/stack-ui',
    ],
    reactCompiler: true,
    // performanceBudget removed for now to avoid Next.js invalid option warning
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/index.html',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
