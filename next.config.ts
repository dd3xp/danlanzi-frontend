import type { NextConfig } from "next";
// @ts-ignore - next-i18next.config.js 是 CommonJS 模块
import { i18nConfig } from './next-i18next.config.js';
import type { I18NConfig } from 'next/dist/server/config-shared';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  i18n: i18nConfig as I18NConfig,
};

export default nextConfig;
