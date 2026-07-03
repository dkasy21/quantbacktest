/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Keep yahoo-finance2 out of the webpack bundle entirely.
  // Its ESM build pulls in test files that import Deno-only packages
  // (@gadicc/fetch-mock-cache/runtimes/deno.ts, @std/testing/mock).
  serverExternalPackages: ['yahoo-finance2'],

  webpack(config, { isServer }) {
    if (isServer) {
      const existing = config.externals ?? [];
      config.externals = [
        ...(Array.isArray(existing) ? existing : [existing]),
        ({ request }, callback) => {
          if (request === 'yahoo-finance2' || request.startsWith('yahoo-finance2/')) {
            return callback(null, 'commonjs ' + request);
          }
          callback();
        },
      ];
    }
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@gadicc/fetch-mock-cache/runtimes/deno.ts': false,
      '@std/testing/mock': false,
    };
    return config;
  },
};

module.exports = nextConfig;
