import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['yahoo-finance2'],
  webpack: (config) => {
    config.resolve.alias['@std/testing/mock'] = false;
    config.resolve.alias['@std/testing'] = false;
    return config;
  },
};

export default nextConfig;
