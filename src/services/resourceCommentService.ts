// 资源评论/回复相关API服务
import { apiCall } from '../utils/apiClient';
import backendUrl from './backendUrl';
import { getAuthHeaders } from '@/utils/auth';

const API_BASE_URL = `${backendUrl}/api`;

// 评论接口
export interface ResourceComment {
  id: number;
  resource_id: number;
  user_id: number;
  content: string;
  status: string;
  created_at: string;
  user?: {
    id: number;
    nickname: string;
    avatar_path?: string;
    role?: string;
  };
  resource?: {
    id: number;
    title: string;
  };
  stats?: {
    like_count: number;
    dislike_count: number;
    net_score: number;
    last_reacted_at?: string;
  };
  userReaction?: 'like' | 'dislike' | null;
}

// 评论列表响应
export interface ResourceCommentsResponse {
  comments: ResourceComment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 获取资源评论列表
export const getResourceComments = async (params?: {
  page?: number;
  limit?: number;
  resource_id?: number;
}): Promise<{ status: string; data?: ResourceCommentsResponse; message?: string }> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const authHeaders = getAuthHeaders();
  Object.assign(headers, authHeaders);

  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.resource_id) queryParams.append('resource_id', params.resource_id.toString());

  const queryString = queryParams.toString();
  const endpoint = `/resourceComments/${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get resource comments:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to get resource comments',
    };
  }
};

// 创建资源评论参数
export interface CreateResourceCommentParams {
  resource_id: number;
  content: string;
}

export const createResourceComment = async (params: CreateResourceCommentParams): Promise<{ status: string; data?: { comment: ResourceComment }; message?: string }> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const authHeaders = getAuthHeaders();
  Object.assign(headers, authHeaders);

  try {
    const response = await fetch(`${API_BASE_URL}/resourceComments/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        resource_id: params.resource_id,
        content: params.content,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to create resource comment:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to create resource comment',
    };
  }
};

// 对资源评论点赞/点踩
export const reactToResourceComment = async (
  commentId: number,
  reaction: 'like' | 'dislike'
): Promise<{ status: string; data?: { reaction: 'like' | 'dislike' | null; stats?: any }; message?: string }> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const authHeaders = getAuthHeaders();
  Object.assign(headers, authHeaders);

  try {
    const response = await fetch(`${API_BASE_URL}/resourceComments/${commentId}/reactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        reaction,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to react to resource comment:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to react to resource comment',
    };
  }
};

