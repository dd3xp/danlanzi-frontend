import type { NextConfig } from "next";
// @ts-ignore - next-i18next.config.js 是 CommonJS 模块
import { i18nConfig } from './next-i18next.config.js';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  i18n: i18nConfig,
};

export default nextConfig;
