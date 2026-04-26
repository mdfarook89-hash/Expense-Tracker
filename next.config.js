/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: 'out',
  // Static export for Firebase Hosting
  output: 'export',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
