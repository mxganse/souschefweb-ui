/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/souschefweb',
  assetPrefix: '/souschefweb', // Forces CSS/JS to load from the correct folder
  images: {
    unoptimized: true,
  },
};

export default nextConfig;