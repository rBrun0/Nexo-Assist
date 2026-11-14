import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["@mastra/core", "@mastra/pg", "@mastra/ai-sdk", "pg"],
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [
      {
        source: "/employee/atendimento",
        destination: "/servicedesk/atendimento",
        permanent: true,
      },
      { source: "/employee/perfil", destination: "/servicedesk/perfil", permanent: true },
      { source: "/analyst", destination: "/analista", permanent: true },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
