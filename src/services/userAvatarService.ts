// 头像相关API服务
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
        return {
          status: 'error',
          message: 'SERVER_RESPONSE_ERROR',
          error: 'SERVER_RESPONSE_ERROR'
        };
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
        return {
          status: 'error',
          message: 'SERVER_RESPONSE_ERROR',
          error: 'SERVER_RESPONSE_ERROR'
        };
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
