/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['yahoo-finance2'],
  },
  webpack: (config, { webpack: wp }) => {
    // Safety net: ignore any Deno stdlib imports inside yahoo-finance2 ESM tree
    config.plugins.push(
      new wp.IgnorePlugin({
        resourceRegExp: /^@std\//,
        contextRegExp: /yahoo-finance2/,
      })
    );
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
