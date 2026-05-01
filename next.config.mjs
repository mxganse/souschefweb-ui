import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* This tells Next.js that the app is served from /souschefweb.
     Without this, all your CSS and JS links will break on your custom domain.
  */
  basePath: '/souschefweb',
  
  images: {
    // Cloudflare Workers don't support the default Next.js image optimizer natively
    unoptimized: true,
  },

  // Ensures compatibility with the 2026 Cloudflare Edge runtime
  experimental: {
    serverActions: {
      allowedOrigins: ['fig8culinary.com', '*.workers.dev'],
    },
  },
};

export default nextConfig;

// Keep this for local development with Cursor
if (process.env.NODE_ENV === 'development') {
  import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
}