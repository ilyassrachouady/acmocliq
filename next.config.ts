import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    "*": ["primalis-theme/**", "output/**", "examples/**"],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
