// 头像相关API服务
import { getAuthHeaders, logout } from '../utils/auth';
import { apiCall, ApiResponse } from '../utils/apiClient';
import backendUrl from './backendUrl';

const API_BASE_URL = `${backendUrl}/api`;

// 处理token过期的辅助函数
const handleTokenExpiry = () => {
  logout();
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    if (currentPath !== '/user/login' && currentPath !== '/user/register') {
      window.location.href = `/user/login?redirect=${encodeURIComponent(currentPath)}`;
    } else {
      window.location.href = '/user/login';
    }
  }
};

// 检查响应是否为token过期错误（不消费response body）
const checkTokenExpiry = (response: Response): boolean => {
  if (response.status === 403 || response.status === 401) {
    // 对于403/401状态码，直接处理为可能的token错误
    // 注意：这里不读取response body，因为body可能已经被消费
    // 实际的错误代码会在apiCall中处理
    handleTokenExpiry();
    return true;
  }
  return false;
};

// 上传头像
export const uploadAvatar = async (formData: FormData): Promise<ApiResponse<{
  avatar_path: string;
  file_info: {
    originalname: string;
    original_size: number;
    original_mimetype: string;
    converted_size: number;
    converted_format: string;
    dimensions: string;
  };
}>> => {
  const headers: Record<string, string> = {};
  const authHeaders = getAuthHeaders();
  Object.assign(headers, authHeaders);
  // 不设置Content-Type，让浏览器自动设置multipart/form-data

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const response = await fetch(`${API_BASE_URL}/userAvatar/`, {
        method: 'POST',
        headers,
        body: formData,
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // 检查token过期（在解析JSON失败时）
        if (response.status === 403 || response.status === 401) {
          checkTokenExpiry(response);
          return {
            status: 'error',
            message: 'TOKEN_EXPIRED',
            error: 'TOKEN_EXPIRED'
          };
        }
        return {
          status: 'error',
          message: 'SERVER_RESPONSE_ERROR',
          error: 'SERVER_RESPONSE_ERROR'
        };
      }

      // 检查token过期（在解析JSON之后）
      if (response.status === 403 || response.status === 401) {
        const errorCode = data?.code || '';
        const errorMessage = data?.message || '';
        
        if (
          errorCode === 'TOKEN_EXPIRED' ||
          errorCode === 'TOKEN_INVALID' ||
          errorCode === 'TOKEN_MISSING' ||
          errorCode === 'TOKEN_ERROR' ||
          errorCode === 'AUTH_REQUIRED' ||
          errorMessage.includes('Invalid or expired token') ||
          errorMessage.includes('Token has expired') ||
          errorMessage.includes('Invalid token') ||
          errorMessage.includes('Access token required')
        ) {
          checkTokenExpiry(response);
          return {
            status: 'error',
            message: data.message || 'TOKEN_EXPIRED',
            error: data.message || 'TOKEN_EXPIRED',
            code: errorCode
          };
        }
      }

      if (!response.ok) {
        return {
          status: 'error',
          message: data.message || 'AVATAR_UPLOAD_FAILED',
          error: data.message || 'AVATAR_UPLOAD_FAILED'
        };
      }

      return data;
    } catch (error) {
      retryCount++;
      
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }
      
      return {
        status: 'error',
        message: 'NETWORK_ERROR',
        error: 'NETWORK_ERROR'
      };
    }
  }

  return {
    status: 'error',
    message: 'UNKNOWN_ERROR',
    error: 'UNKNOWN_ERROR'
  };
};

// 系统头像类型定义
interface SystemAvatar {
  filename: string;
  name: string;
  size: number;
  type: 'system';
  mimeType: 'image/png';
  url: string;
}

interface SystemAvatarsResponse {
  avatars: SystemAvatar[];
  total: number;
  directory: 'system';
}

// 获取用户头像
export const getUserAvatar = async (userId: string | number): Promise<{
  status: 'success' | 'error';
  message: string;
  avatar_data_url?: string;
}> => {
  return apiCall<{avatar_data_url: string}>(`/userAvatar/user/${userId}`, {
    method: 'GET',
  }, true);
};

// 获取系统预设头像列表
export const getSystemAvatars = async (): Promise<ApiResponse<SystemAvatarsResponse>> => {
  const response = await apiCall<SystemAvatarsResponse>('/userAvatar/system', {
    method: 'GET',
  }, true);

  if (response.status === 'success' && response.data) {
    // 获取每个头像的 base64 数据
    const avatarsWithData = await Promise.all(
      response.data.avatars.map(async (avatar) => {
        try {
          const imageResponse = await fetch(`${API_BASE_URL}/userAvatar/system/${avatar.filename}`, {
            headers: getAuthHeaders(),
          });
          const blob = await imageResponse.blob();
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          return {
            ...avatar,
            url: dataUrl
          };
        } catch (error) {
          console.error(`Failed to load avatar ${avatar.filename}:`, error);
          return avatar;
        }
      })
    );
    response.data.avatars = avatarsWithData;
  }

  return response;
};

// 获取指定的系统头像
export const getSystemAvatar = async (filename: string): Promise<Response> => {
  // 这个接口直接返回图片数据，不需要 apiCall 包装
  const headers: Record<string, string> = {};
  const authHeaders = getAuthHeaders();
  Object.assign(headers, authHeaders);

  return fetch(`${API_BASE_URL}/userAvatar/system/${filename}`, {
    method: 'GET',
    headers
  });
};

// 设置系统头像
export const setSystemAvatar = async (filename: string): Promise<ApiResponse<{
  avatar_path: string;
  file_info: {
    filename: string;
    size: number;
    format: string;
    dimensions: string;
  };
}>> => {
  const headers: Record<string, string> = {};
  const authHeaders = getAuthHeaders();
  Object.assign(headers, authHeaders);

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const response = await fetch(`${API_BASE_URL}/userAvatar/system/${filename}`, {
        method: 'POST',
        headers,
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // 检查token过期（在解析JSON失败时）
        if (response.status === 403 || response.status === 401) {
          checkTokenExpiry(response);
          return {
            status: 'error',
            message: 'TOKEN_EXPIRED',
            error: 'TOKEN_EXPIRED'
          };
        }
        return {
          status: 'error',
          message: 'SERVER_RESPONSE_ERROR',
          error: 'SERVER_RESPONSE_ERROR'
        };
      }

      // 检查token过期（在解析JSON之后）
      if (response.status === 403 || response.status === 401) {
        const errorCode = data?.code || '';
        const errorMessage = data?.message || '';
        
        if (
          errorCode === 'TOKEN_EXPIRED' ||
          errorCode === 'TOKEN_INVALID' ||
          errorCode === 'TOKEN_MISSING' ||
          errorCode === 'TOKEN_ERROR' ||
          errorCode === 'AUTH_REQUIRED' ||
          errorMessage.includes('Invalid or expired token') ||
          errorMessage.includes('Token has expired') ||
          errorMessage.includes('Invalid token') ||
          errorMessage.includes('Access token required')
        ) {
          checkTokenExpiry(response);
          return {
            status: 'error',
            message: data.message || 'TOKEN_EXPIRED',
            error: data.message || 'TOKEN_EXPIRED',
            code: errorCode
          };
        }
      }

      if (!response.ok) {
        return {
          status: 'error',
          message: data.message || 'SYSTEM_AVATAR_SET_FAILED',
          error: data.message || 'SYSTEM_AVATAR_SET_FAILED'
        };
      }

      return data;
    } catch (error) {
      retryCount++;
      
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }
      
      return {
        status: 'error',
        message: 'NETWORK_ERROR',
        error: 'NETWORK_ERROR'
      };
    }
  }

  return {
    status: 'error',
    message: 'UNKNOWN_ERROR',
    error: 'UNKNOWN_ERROR'
  };
};
