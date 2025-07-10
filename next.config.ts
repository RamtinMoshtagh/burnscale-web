/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {},
  },
  images: {
    domains: [
      'oaidalleapiprodscus.blob.core.windows.net', // DALL·E
      'illustrations.popsy.co',                   // Popsy illustrations
    ],
  },
  async redirects() {
    return [];
  },
};

module.exports = nextConfig;
