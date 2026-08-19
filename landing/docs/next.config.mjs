/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/docs',
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
