/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Prevent Next.js from bundling yahoo-finance2 — let Node require() it at
  // runtime. This is needed because the package's ESM build pulls in test
  // files (esm/tests/fetchCache.js) that import Deno-only packages such as
  // @gadicc/fetch-mock-cache/runtimes/deno.ts and @std/testing/mock, which
  // don't exist in a Node/webpack environment.
  //
  // serverExternalPackages is the Next.js 14.2+ API (replaces the old
  // experimental.serverComponentsExternalPackages).
  serverExternalPackages: ['yahoo-finance2'],

  webpack(config, { isServer }) {
    if (isServer) {
      // Belt-and-suspenders: mark yahoo-finance2 as a webpack external so
      // webpack never tries to bundle or even traverse its module graph.
      const existing = config.externals ?? [];
      config.externals = [
        ...(Array.isArray(existing) ? existing : [existing]),
        ({ request }, callback) => {
          if (request === 'yahoo-finance2' || request.startsWith('yahoo-finance2/')) {
            // commonjs so Node can require() it
            return callback(null, 'commonjs ' + request);
          }
          callback();
        },
      ];
    }

    // Extra safety: if webpack ever does walk into the yahoo-finance2 package,
    // stub out the Deno-only modules so the build doesn't fail.
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
