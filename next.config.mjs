/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/souschefweb',
  assetPrefix: '/souschefweb', // This ensures CSS loads from the correct folder
  images: {
    unoptimized: true,
  },
};

export default nextConfig;