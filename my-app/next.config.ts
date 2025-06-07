/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable Next.js's built-in PostCSS support to avoid conflicts
  // and ensure it uses postcss.config.mjs fully.
  experimental: {
    // This might be the correct key for Next.js 15.x if it's not in `webpack`
    // For Next.js 13/14, it was more commonly part of `webpack` config.
    // If this doesn't work, we might need to look into `webpack` configuration.
    optimizeCss: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/:path*', // Use local Flask backend for development
      },
    ];
  },
};

module.exports = nextConfig;
