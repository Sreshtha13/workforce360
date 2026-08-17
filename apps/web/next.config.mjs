import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  experimental: {
    // Monorepo: keep file tracing rooted at the repo root (Next 14).
    outputFileTracingRoot: path.join(__dirname, "../.."),
    instrumentationHook: true,
  },
};

export default nextConfig;
