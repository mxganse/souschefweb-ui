/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/souschefweb',
  // assetPrefix is usually not needed if basePath is set correctly, 
  // but we'll leave it out to let Next.js handle it automatically.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;