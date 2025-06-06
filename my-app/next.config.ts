/** @type {import('next').NextConfig} */
const nextConfig = {
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
