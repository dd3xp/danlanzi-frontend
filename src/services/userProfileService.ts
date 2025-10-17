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
  avatar_data_url?: string;
  role: string;
  status: string;
  department?: string;
  major?: string;
  bio?: string;
  security_email?: string;
  theme?: string;
  language?: string;
  show_student_id?: boolean;
  show_department?: boolean;
  show_major?: boolean;
  show_bio?: boolean;
  created_at: string;
  updated_at?: string;
}

// 通用API调用函数
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  requireAuth: boolean = false
): Promise<ApiResponse<T>> {
  const maxRetries = 3;
  let retryCount = 0;
  let lastError: any = null;

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
      lastError = error;
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

// 获取用户信息（可选传入userId以查看他人资料）
export const getUserProfile = async (userId?: string | number): Promise<ApiResponse<User>> => {
  const endpoint = userId ? `/userProfile/profile/${userId}` : '/userProfile/profile';
  return apiCall<User>(endpoint, {
    method: 'GET',
  }, true); // 需要认证
};

// 更新用户资料（包含隐私设置）
export const updateUserProfile = async (profileData: {
  nickname?: string;
  department?: string;
  major?: string;
  bio?: string;
  security_email?: string;
  theme?: string;
  language?: string;
  show_student_id?: boolean;
  show_department?: boolean;
  show_major?: boolean;
  show_bio?: boolean;
}): Promise<ApiResponse<User>> => {
  return apiCall<User>('/userProfile/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  }, true); // 需要认证
};

// 获取公开用户资料
export const getPublicProfile = async (userId: string | number): Promise<ApiResponse<User>> => {
  return apiCall<User>(`/userProfile/profile/${userId}`, {
    method: 'GET',
  }, false);
};

// 获取系统头像列表
export const getSystemAvatars = async (): Promise<ApiResponse<string[]>> => {
  return apiCall<string[]>('/userAvatar/system', {
    method: 'GET',
  }, true);
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
