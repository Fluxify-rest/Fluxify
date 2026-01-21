import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  basePath: "/_/admin/ui",

  transpilePackages: ["@fluxify/lib", "@fluxify/adapters", "@fluxify/blocks"],
};

export default nextConfig;
