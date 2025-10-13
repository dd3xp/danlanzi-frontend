/**
 * 验证是否为复旦大学学生邮箱
 * @param email 邮箱地址
 * @returns 是否为有效的复旦大学学生邮箱
 */
export const validateFudanEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // 去除首尾空格
  const trimmedEmail = email.trim();
  
  // 检查邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return false;
  }

  // 分割邮箱地址
  const [localPart, domain] = trimmedEmail.split('@');
  
  // 检查@前的部分是否为11位数字
  const localPartRegex = /^\d{11}$/;
  if (!localPartRegex.test(localPart)) {
    return false;
  }

  // 检查域名是否为复旦大学邮箱
  const validDomains = ['m.fudan.edu.cn', 'fudan.edu.cn'];
  if (!validDomains.includes(domain)) {
    return false;
  }

  return true;
};

/**
 * 获取邮箱验证错误信息
 * @param email 邮箱地址
 * @param t 翻译函数
 * @returns 错误信息，如果验证通过则返回空字符串
 */
export const getEmailValidationError = (email: string, t: (key: string) => string): string => {
  if (!email || typeof email !== 'string') {
    return t('register.errors.emailRequired');
  }

  const trimmedEmail = email.trim();
  
  if (!trimmedEmail) {
    return t('register.errors.emailRequired');
  }

  // 检查基本邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return t('register.errors.emailInvalid');
  }

  const [localPart, domain] = trimmedEmail.split('@');
  
  // 检查@前的部分
  const localPartRegex = /^\d{11}$/;
  if (!localPartRegex.test(localPart)) {
    return t('register.errors.emailStudentIdInvalid');
  }

  // 检查域名
  const validDomains = ['m.fudan.edu.cn', 'fudan.edu.cn'];
  if (!validDomains.includes(domain)) {
    return t('register.errors.emailNotFudan');
  }

  return '';
};
