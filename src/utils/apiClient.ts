// 统一的API客户端，处理认证错误和token过期
import { getAuthHeaders, logout } from './auth';
import backendUrl from '../services/backendUrl';

const API_BASE_URL = `${backendUrl}/api`;

// 通用API响应类型
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  user?: T;
  token?: string;
  error?: string;
  errors?: any[];
  code?: string; // 后端返回的错误代码
  expiredAt?: string; // token过期时间
}

// Token过期处理标志，避免重复处理
let isHandlingTokenExpiry = false;

// 处理token过期
const handleTokenExpiry = () => {
  if (isHandlingTokenExpiry) return;
  isHandlingTokenExpiry = true;

  // 清除token和用户信息
  logout();

  // 延迟重置标志，避免立即重复处理
  setTimeout(() => {
    isHandlingTokenExpiry = false;
  }, 1000);

  // 跳转到登录页
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    // 如果不在登录/注册页，跳转到登录页并保存当前路径
    if (currentPath !== '/user/login' && currentPath !== '/user/register') {
      window.location.href = `/user/login?redirect=${encodeURIComponent(currentPath)}`;
    } else {
      window.location.href = '/user/login';
    }
  }
};

// 检查响应是否为token过期错误
const isTokenError = (response: Response, data: any): boolean => {
  if (response.status === 403 || response.status === 401) {
    const errorCode = data?.code || '';
    const errorMessage = data?.message || '';
    
    // 检查错误代码
    if (
      errorCode === 'TOKEN_EXPIRED' ||
      errorCode === 'TOKEN_INVALID' ||
      errorCode === 'TOKEN_MISSING' ||
      errorCode === 'TOKEN_ERROR' ||
      errorCode === 'AUTH_REQUIRED'
    ) {
      return true;
    }
    
    // 检查错误消息（兼容旧版本）
    if (
      errorMessage.includes('Invalid or expired token') ||
      errorMessage.includes('Token has expired') ||
      errorMessage.includes('Invalid token') ||
      errorMessage.includes('Access token required')
    ) {
      return true;
    }
  }
  return false;
};

// 通用API调用函数
export async function apiCall<T>(
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

      // 处理token相关错误（403或401）
      if ((response.status === 403 || response.status === 401) && requireAuth) {
        if (isTokenError(response, data)) {
          handleTokenExpiry();
          return {
            status: 'error',
            message: data.message || 'TOKEN_EXPIRED',
            error: data.message || 'TOKEN_EXPIRED',
            code: data.code || 'TOKEN_EXPIRED',
            expiredAt: data.expiredAt
          };
        }
      }

      if (!response.ok) {
        // 返回错误响应而不是抛出异常
        return {
          status: 'error',
          message: data.message || 'API_REQUEST_FAILED',
          error: data.message || 'API_REQUEST_FAILED',
          code: data.code,
          ...data
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

