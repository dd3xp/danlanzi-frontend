const i18nConfig = {
  defaultLocale: 'zh-CN',
  locales: ['zh-CN', 'en-US'],
  localeDetection: false,
};

module.exports = {
  i18n: i18nConfig
};

// 导出配置供 next.config.ts 使用
module.exports.i18nConfig = i18nConfig;
