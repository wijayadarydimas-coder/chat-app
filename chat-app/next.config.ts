// next.config.js — Fixed untuk Next.js 16 + Turbopack
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // Next.js 16: pindah dari experimental.serverComponentsExternalPackages
  serverExternalPackages: ['mongoose', 'jsonwebtoken', 'bcryptjs'],

  // Turbopack (default di Next.js 16) — set kosong agar tidak error
  turbopack: {},

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },

  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Accept-Ranges', value: 'bytes' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;