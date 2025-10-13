import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  i18n: {
    defaultLocale: 'ms',
    locales: ['zh', 'en', 'ms'],
  },
};

export default nextConfig;
