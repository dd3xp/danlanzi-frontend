// 验证码相关API服务
import { apiCall, ApiResponse } from '../utils/apiClient';

// 发送验证码
export const sendVerificationCode = async (email: string, type: 'email_verification' | 'password_reset' | 'login' = 'email_verification'): Promise<ApiResponse<{ messageId: string; expiresAt: string }>> => {
  return apiCall<{ messageId: string; expiresAt: string }>('/verification/send-verification-code', {
    method: 'POST',
    body: JSON.stringify({
      to: email,
      subject: type === 'email_verification' ? '邮箱验证码' : type === 'password_reset' ? '密码重置验证码' : '登录验证码',
      text: type === 'email_verification' ? '您的验证码是：' : type === 'password_reset' ? '您的密码重置验证码是：' : '您的登录验证码是：',
      type: type
    }),
  }, false); // 发送验证码不需要认证
};

// 验证验证码
export const verifyCode = async (email: string, code: string, type: 'email_verification' | 'password_reset' | 'login' = 'email_verification'): Promise<ApiResponse<null>> => {
  return apiCall<null>('/verification/verify-code', {
    method: 'POST',
    body: JSON.stringify({
      email: email,
      code: code,
      type: type
    }),
  }, false); // 验证验证码不需要认证
};

