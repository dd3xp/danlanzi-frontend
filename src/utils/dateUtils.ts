// 日期格式化工具函数

/**
 * 格式化日期时间为本地化字符串
 * @param dateString 日期字符串
 * @param locale 语言代码，默认为 'zh-CN'
 * @returns 格式化后的日期字符串
 */
export function formatDateTime(dateString?: string | null, locale: string = 'zh-CN'): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
