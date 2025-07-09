/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {},
  },
  async redirects() {
    return [];
  },
};

module.exports = nextConfig;
