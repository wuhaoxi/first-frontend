/** @type {import('next').NextConfig} */
const nextConfig = {
  // The assistant chat streams SSE through the /api rewrite; the dev server's
  // compression middleware holds the gzip stream without flushing, so the
  // browser receives nothing until the request times out. Production traffic
  // sits behind a reverse proxy that can compress, so Next-level compression
  // stays off.
  compress: false,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'upload.wikimedia.org' }],
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:8080/api/:path*' },
    ];
  },
};

export default nextConfig;
