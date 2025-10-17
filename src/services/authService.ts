// 认证相关API服务
import { getAuthHeaders } from '../utils/auth';
import backendUrl from './backendUrl';

const API_BASE_URL = `${backendUrl}/api`;

// 通用API响应类型
interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  error?: string;
  errors?: any[];
}

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

// 通用API调用函数
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  requireAuth: boolean = false
): Promise<ApiResponse<T>> {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      // 如果需要认证，添加认证头
      if (requireAuth) {
        const authHeaders = getAuthHeaders();
        Object.assign(headers, authHeaders);
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers,
        ...options,
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // JSON解析失败，返回错误码让前端处理
        return {
          status: 'error',
          message: 'SERVER_RESPONSE_ERROR',
          error: 'SERVER_RESPONSE_ERROR'
        };
      }

      if (!response.ok) {
        // 返回错误响应而不是抛出异常
        return {
          status: 'error',
          message: data.message || 'API_REQUEST_FAILED',
          error: data.message || 'API_REQUEST_FAILED'
        };
      }

      return data;
    } catch (error) {
      retryCount++;
      
      // 如果还有重试次数，等待后重试
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }
      
      // 所有重试都失败了，返回网络错误
      return {
        status: 'error',
        message: 'NETWORK_ERROR',
        error: 'NETWORK_ERROR'
      };
    }
  }

  // 这里理论上不会执行到，因为循环中已经处理了所有情况
  return {
    status: 'error',
    message: 'UNKNOWN_ERROR',
    error: 'UNKNOWN_ERROR'
  };
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
