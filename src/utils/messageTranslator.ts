import { TFunction } from 'i18next';

export interface BackendMessageResponse {
  status: 'error' | 'success';
  message: string;
  error?: string;
  errors?: any[];
  help?: string;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  user?: T;
  token?: string;
  error?: string;
  errors?: any[];
  help?: string;
}

export function translateBackendMessage(
  messageResponse: BackendMessageResponse | ApiResponse | string,
  t: TFunction
): string {
  const message = typeof messageResponse === 'string' ? messageResponse : messageResponse.message;

  const messageMap: Record<string, string> = {
    // 通用错误
    'SERVER_RESPONSE_ERROR': 'common.errors.serverResponseError',
    'Network Error': 'common.errors.networkError',
    
    // 认证相关消息
    'Invalid email or password': 'auth.errors.invalidCredentials',
    'Registration failed': 'auth.errors.registrationFailed',
    'Login failed': 'auth.errors.loginFailed',
    'Email already registered': 'auth.errors.emailAlreadyRegistered',
    'Registration successful': 'auth.success.registrationSuccessful',
    'Login successful': 'auth.success.loginSuccessful',
    
    // 验证码相关消息
    'Invalid or expired verification code': 'verification.errors.invalidOrExpired',
    'Verification code sent successfully': 'verification.success.sent',
    'Verification code verified successfully': 'verification.success.verified',
    'Failed to send verification code': 'verification.errors.sendFailed',
    'Failed to verify verification code': 'verification.errors.verifyFailed',
    
    // 邮件相关消息
    'Email sent successfully': 'email.success.sent',
    'Failed to send email': 'email.errors.sendFailed',
    'Gmail email service not configured, please check EMAIL_USER and EMAIL_PASS environment variables': 'email.errors.notConfigured',
    'Gmail configuration incomplete': 'email.errors.configIncomplete',
    'Gmail configuration correct, connection test successful': 'email.success.configCorrect',
    'Gmail connection test failed': 'email.errors.connectionFailed',
    
    // 参数验证错误
    'Parameter validation failed': 'validation.errors.parameterValidationFailed',
    'Invalid email format': 'validation.errors.invalidEmailFormat',
    'Email subject cannot be empty': 'validation.errors.emailSubjectRequired',
    'Email text content cannot be empty': 'validation.errors.emailContentRequired',
    'Email content cannot be empty': 'validation.errors.emailContentRequired',
    'Invalid verification code type': 'validation.errors.invalidVerificationCodeType',
    
    // 数据库和系统错误
    'Database connection failed': 'system.errors.databaseConnectionFailed',
    'Internal server error': 'system.errors.internalServerError',
    'Service temporarily unavailable': 'system.errors.serviceUnavailable',
    
    // 用户相关错误
    'User already exists': 'user.errors.alreadyExists',
    'User not found': 'user.errors.notFound',
    'Account is disabled': 'user.errors.accountDisabled',
    'Account is locked': 'user.errors.accountLocked',
    
    // 用户信息相关消息
    'User profile retrieved successfully': 'user.success.profileRetrieved',
    'Failed to retrieve user profile': 'user.errors.profileRetrieveFailed',
    'Access token required': 'auth.errors.accessTokenRequired',
    'Invalid or expired token': 'auth.errors.invalidOrExpiredToken'
  };

  const translationKey = messageMap[message];
  
  if (translationKey) {
    return t(translationKey, { ns: 'messages' });
  }
  
  return message;
}

export function translateApiMessage(
  messageResponse: BackendMessageResponse | ApiResponse | string,
  t: TFunction,
  fallbackKey?: string
): string {
  const translated = translateBackendMessage(messageResponse, t);
  
  if (translated === (typeof messageResponse === 'string' ? messageResponse : messageResponse.message)) {
    return fallbackKey ? t(fallbackKey) : translated;
  }
  
  return translated;
}
