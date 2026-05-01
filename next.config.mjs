/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/souschefweb',
  images: {
    unoptimized: true,
  },
  // Removed assetPrefix to avoid routing double-dipping
};

export default nextConfig;