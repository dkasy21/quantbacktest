/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['yahoo-finance2'],
  experimental: {
    serverComponentsExternalPackages: ['yahoo-finance2'],
  },
};

export default nextConfig;
