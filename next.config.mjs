const isTauri = process.env.TAURI === '1';
const isProd = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // `standalone` is for production `next start`. Leaving it on during `next dev`
  // makes App Router miss async chunks (Monaco 404 → /_not-found).
  output: isTauri ? 'export' : isProd ? 'standalone' : undefined,
  images: {
    unoptimized: true
  },
  // Tauri dev loads the app from 127.0.0.1 while Next binds to 0.0.0.0:1420
  allowedDevOrigins: ['127.0.0.1', 'localhost']
};

export default nextConfig;
