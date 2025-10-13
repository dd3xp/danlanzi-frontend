export const validateFudanEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const trimmedEmail = email.trim();
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return false;
  }

  const [localPart, domain] = trimmedEmail.split('@');
  
  const localPartRegex = /^\d{11}$/;
  if (!localPartRegex.test(localPart)) {
    return false;
  }

  const validDomains = ['m.fudan.edu.cn', 'fudan.edu.cn'];
  if (!validDomains.includes(domain)) {
    return false;
  }

  return true;
};

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
