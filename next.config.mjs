import withPWA from 'next-pwa';

const isProd = process.env.NODE_ENV === 'production';

const withPwaConfig = withPWA({
  dest: 'public',
  disable: !isProd,
  register: true,
  scope: '/',
  sw: 'service-worker.js',
});

const nextConfig = withPwaConfig({
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
});

export default nextConfig;
