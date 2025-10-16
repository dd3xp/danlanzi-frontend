const i18nConfig = {
  defaultLocale: 'zh',
  locales: ['zh', 'en'],
};

module.exports = {
  i18n: i18nConfig
};

// 导出配置供 next.config.ts 使用
module.exports.i18nConfig = i18nConfig;
