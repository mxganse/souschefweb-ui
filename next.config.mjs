/** @type {import('next').NextConfig} */
const nextConfig = {
  /* 1. Fixes the 404: Tells Next.js to look for files at /souschefweb 
  */
  basePath: '/souschefweb',

  /* 2. Fixes the 500: Cloudflare Workers don't support Next.js's 
     default image optimization, which often causes runtime crashes.
  */
  images: {
    unoptimized: true,
  },

  experimental: {
    serverActions: {
      allowedOrigins: ['fig8culinary.com', '*.workers.dev'],
    },
  },
};

/* 3. Fixes the "reading default" Error:
   This import is ONLY for your local Cursor environment. 
   If it runs on Cloudflare, it throws that 'undefined' error.
*/
if (process.env.NODE_ENV === 'development') {
  import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
}

export default nextConfig;