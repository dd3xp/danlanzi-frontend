import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en', 'ms'],
  },
};

export default nextConfig;
