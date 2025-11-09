/** @type {import('next').NextConfig} */
const nextConfig = {
  // Isolate build directory
  distDir: '.next-vybeztribe',

  // React strict mode
  reactStrictMode: true,

  // Images
  images: {
    unoptimized: true,
  },

  // Environment
  env: {
    PROJECT_ID: 'vybeztribe-app',
  },

  // Compiler
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Dev indicators
  devIndicators: {
    position: 'bottom-right',
  },
};

module.exports = nextConfig;