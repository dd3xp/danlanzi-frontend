// 用户信息相关API服务
import { getAuthHeaders } from '../utils/auth';
import backendUrl from './backendUrl';

const API_BASE_URL = `${backendUrl}/api`;

// 通用API响应类型
interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  user?: T;
  error?: string;
  errors?: any[];
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

// 通用API调用函数
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  requireAuth: boolean = false
): Promise<ApiResponse<T>> {
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
        message: data.message || 'API request failed',
        error: data.message || 'API request failed'
      };
    }

    return data;
  } catch (error) {
    console.error('API call failed:', error);
    // 网络错误等异常情况才抛出
    throw error;
  }
}

// 获取用户信息（可选传入userId以查看他人资料）
export const getUserProfile = async (userId?: string | number): Promise<ApiResponse<User>> => {
  const endpoint = userId ? `/userprofile/profile/${userId}` : '/userprofile/profile';
  return apiCall<User>(endpoint, {
    method: 'GET',
  }, true); // 需要认证
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
