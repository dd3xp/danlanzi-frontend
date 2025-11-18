// 资源相关API服务
import { apiCall, ApiResponse } from '../utils/apiClient';
import { getAuthHeaders } from '../utils/auth';
import backendUrl from './backendUrl';

const API_BASE_URL = `${backendUrl}/api`;

// 资源类型
export type ResourceType = 'file' | 'link' | 'note';

// 资源可见性
export type ResourceVisibility = 'public' | 'course' | 'private';

// 上传资源接口
export interface UploadResourceParams {
  type: ResourceType;
  title: string;
  description?: string;
  url_or_path?: string;
  visibility?: ResourceVisibility;
  course_id?: number;
  offering_id?: number;
  file?: File;
  tags?: string[];
}

// 资源接口
export interface Resource {
  id: number;
  uploader_id: number;
  type: ResourceType;
  title: string;
  description?: string;
  url_or_path?: string;
  visibility: ResourceVisibility;
  status: string;
  tags?: string[];
  created_at: string;
  updated_at?: string;
  courseLinks?: Array<{
    id: number;
    resource_id: number;
    course_id?: number;
    offering_id?: number;
    offering?: {
      id: number;
      course_id: number;
      term: string;
      section?: string;
      instructor?: string;
    };
  }>;
}

// 资源列表响应
export interface ResourcesResponse {
  resources: Resource[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 获取资源列表
export const getResources = async (params?: {
  page?: number;
  limit?: number;
  course_id?: number;
  offering_id?: number;
  search?: string;
}): Promise<ApiResponse<ResourcesResponse>> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.course_id) queryParams.append('course_id', params.course_id.toString());
  if (params?.offering_id) queryParams.append('offering_id', params.offering_id.toString());
  if (params?.search) queryParams.append('search', params.search);

  const queryString = queryParams.toString();
  const endpoint = `/resources/${queryString ? `?${queryString}` : ''}`;
  
  return apiCall<ResourcesResponse>(endpoint, {
    method: 'GET',
  }, false);
};

// 上传资源
export const uploadResource = async (params: UploadResourceParams): Promise<ApiResponse<any>> => {
  const formData = new FormData();
  
  // 添加文件（如果有）
  if (params.file) {
    formData.append('file', params.file);
  }
  
  // 添加其他字段
  formData.append('type', params.type);
  formData.append('title', params.title);
  if (params.description) {
    formData.append('description', params.description);
  }
  if (params.url_or_path) {
    formData.append('url_or_path', params.url_or_path);
  }
  if (params.visibility) {
    formData.append('visibility', params.visibility);
  }
  if (params.course_id) {
    formData.append('course_id', params.course_id.toString());
  }
  if (params.offering_id) {
    formData.append('offering_id', params.offering_id.toString());
  }
  if (params.tags && params.tags.length > 0) {
    formData.append('tags', JSON.stringify(params.tags));
  }

  const headers: Record<string, string> = {};
  const authHeaders = getAuthHeaders();
  Object.assign(headers, authHeaders);
  // 不设置Content-Type，让浏览器自动设置multipart/form-data

  try {
    const response = await fetch(`${API_BASE_URL}/resources/`, {
      method: 'POST',
      headers,
      body: formData,
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      if (response.status === 403 || response.status === 401) {
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

    if (!response.ok) {
      const errorCode = data?.code || '';
      const errorMessage = data?.message || '';

      if (
        response.status === 403 || response.status === 401 ||
        errorCode === 'TOKEN_EXPIRED' ||
        errorCode === 'TOKEN_INVALID' ||
        errorCode === 'TOKEN_MISSING' ||
        errorMessage.includes('Invalid or expired token') ||
        errorMessage.includes('Token has expired')
      ) {
        return {
          status: 'error',
          message: data.message || 'TOKEN_EXPIRED',
          error: data.message || 'TOKEN_EXPIRED',
          code: errorCode
        };
      }

      return {
        status: 'error',
        message: data.message || 'API_REQUEST_FAILED',
        error: data.message || 'API_REQUEST_FAILED',
        code: errorCode
      };
    }

    return data;
  } catch (error: any) {
    return {
      status: 'error',
      message: 'NETWORK_ERROR',
      error: 'NETWORK_ERROR'
    };
  }
};

