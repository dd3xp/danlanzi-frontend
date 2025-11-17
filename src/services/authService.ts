// 认证相关API服务
import { apiCall, ApiResponse } from '../utils/apiClient';

// 发送验证码请求参数
interface SendVerificationCodeRequest {
  to: string;
  subject: string;
  text: string;
  type?: 'email_verification' | 'password_reset' | 'login';
}

// 发送验证码响应
interface SendVerificationCodeResponse {
  messageId: string;
  expiresAt: string;
}

// 验证验证码请求参数
interface VerifyCodeRequest {
  email: string;
  code: string;
  type?: 'email_verification' | 'password_reset' | 'login';
}

// 用户注册请求参数
interface RegisterRequest {
  nickname: string;
  email: string;
  password: string;
  verificationCode: string;
}

// 用户信息
interface User {
  id: number;
  nickname: string;
  email: string;
  student_id?: string;
  avatar_path?: string;
  role: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

// 注册响应
interface RegisterResponse {
  user: User;
}


// 发送验证码
export const sendVerificationCode = async (
  request: SendVerificationCodeRequest
): Promise<ApiResponse<SendVerificationCodeResponse>> => {
  return apiCall<SendVerificationCodeResponse>('/verification/send-verification-code', {
    method: 'POST',
    body: JSON.stringify(request),
  });
};

// 验证验证码
export const verifyCode = async (
  request: VerifyCodeRequest
): Promise<ApiResponse> => {
  return apiCall('/verification/verify-code', {
    method: 'POST',
    body: JSON.stringify(request),
  });
};

// 用户注册
export const registerUser = async (
  request: RegisterRequest
): Promise<ApiResponse<RegisterResponse>> => {
  return apiCall<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(request),
  });
};

// 用户登录
export const loginUser = async (credentials: {
  email: string;
  password: string;
}): Promise<{
  status: 'success' | 'error';
  message: string;
  user?: {
    id: number;
    nickname: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
  };
  token?: string;
  error?: string;
}> => {
  return apiCall('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
};


// 错误处理函数
export const handleAPIError = (error: any): string => {
  if (error.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};
