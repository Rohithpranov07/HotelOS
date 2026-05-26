/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@hotel-os/types'],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
