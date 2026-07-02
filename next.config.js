/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['yahoo-finance2'],
  webpack: (config) => {
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['@std/testing/mock'] = false;
    config.resolve.alias['@std/testing'] = false;
    return config;
  },
};

export default nextConfig;
