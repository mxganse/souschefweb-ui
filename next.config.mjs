/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['child_process', 'fs', 'os', 'path', 'pdfkit'],
}

export default nextConfig
