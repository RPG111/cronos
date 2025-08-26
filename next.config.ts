// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ No detengas el build por ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ✅ No detengas el build por errores de TypeScript
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
