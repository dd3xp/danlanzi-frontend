// 课评评论/回复相关API服务
import { apiCall } from '../utils/apiClient';
import backendUrl from './backendUrl';
import { getAuthHeaders } from '@/utils/auth';

const API_BASE_URL = `${backendUrl}/api`;

// 评论接口
export interface ReviewComment {
  id: number;
  review_id: number;
  user_id: number;
  content: string;
  status: string;
  created_at: string;
  floor_number?: number;
  user?: {
    id: number;
    nickname: string;
    avatar_path?: string;
    role?: string;
  };
  review?: {
    id: number;
    course_id: number;
    offering_id?: number;
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
export interface ReviewCommentsResponse {
  comments: ReviewComment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 获取评论列表
export const getReviewComments = async (params: {
  review_id: number;
  page?: number;
  limit?: number;
}): Promise<{ status: string; data?: ReviewCommentsResponse; message?: string }> => {
  const queryParams = new URLSearchParams();
  queryParams.append('review_id', params.review_id.toString());
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = `/reviewComments/${queryString ? `?${queryString}` : ''}`;
  
  return apiCall<ReviewCommentsResponse>(endpoint, {
    method: 'GET',
  }, false);
};

// 获取单条评论详情
export const getReviewComment = async (commentId: number): Promise<{ status: string; data?: { comment: ReviewComment }; message?: string }> => {
  return apiCall<{ comment: ReviewComment }>(`/reviewComments/${commentId}`, {
    method: 'GET',
  }, false);
};

// 创建评论
export interface CreateReviewCommentParams {
  review_id: number;
  content: string;
}

export const createReviewComment = async (params: CreateReviewCommentParams): Promise<{ status: string; data?: { comment: ReviewComment }; message?: string }> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const authHeaders = getAuthHeaders();
  Object.assign(headers, authHeaders);

  try {
    const response = await fetch(`${API_BASE_URL}/reviewComments/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        review_id: params.review_id,
        content: params.content,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to create review comment:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to create review comment',
    };
  }
};

// 更新评论
export const updateReviewComment = async (
  commentId: number,
  params: { content?: string; status?: string }
): Promise<{ status: string; data?: { comment: ReviewComment }; message?: string }> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const authHeaders = getAuthHeaders();
  Object.assign(headers, authHeaders);

  try {
    const response = await fetch(`${API_BASE_URL}/reviewComments/${commentId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(params),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to update review comment:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to update review comment',
    };
  }
};

// 点赞/点踩评论
export const reactToComment = async (
  commentId: number,
  reaction: 'like' | 'dislike'
): Promise<{ status: string; data?: { reaction: 'like' | 'dislike' | null; stats: any }; message?: string }> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const authHeaders = getAuthHeaders();
  Object.assign(headers, authHeaders);

  try {
    const response = await fetch(`${API_BASE_URL}/reviewComments/${commentId}/reactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reaction }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to react to comment:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to react to comment',
    };
  }
};

// 删除评论
export const deleteReviewComment = async (commentId: number): Promise<{ status: string; message?: string }> => {
  const headers: Record<string, string> = {};
  const authHeaders = getAuthHeaders();
  Object.assign(headers, authHeaders);

  try {
    const response = await fetch(`${API_BASE_URL}/reviewComments/${commentId}`, {
      method: 'DELETE',
      headers,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to delete review comment:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to delete review comment',
    };
  }
};

