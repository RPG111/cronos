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
  env: {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    LEADS_EMAIL_TO: process.env.LEADS_EMAIL_TO,
  },
};

export default nextConfig;
