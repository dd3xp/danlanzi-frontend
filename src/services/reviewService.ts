// 课评相关API服务
import { apiCall, ApiResponse } from '../utils/apiClient';
import { getAuthHeaders } from '../utils/auth';
import backendUrl from './backendUrl';

const API_BASE_URL = `${backendUrl}/api`;

// 课评接口
export interface Review {
  id: number;
  author_id: number;
  course_id: number;
  offering_id?: number;
  rating_overall?: number;
  rating_difficulty?: number;
  rating_workload?: number;
  rating_teaching?: number;
  title?: string;
  content?: string;
  is_anonymous: boolean;
  status: string;
  created_at: string;
  author?: {
    id: number;
    nickname: string;
    avatar_path?: string;
  };
  course?: {
    id: number;
    name: string;
    dept?: string;
  };
  offering?: {
    id: number;
    course_id: number;
    term: string;
    section?: string;
    instructor?: string | string[];
    course?: {
      id: number;
      name: string;
      dept?: string;
    };
  };
  stats?: {
    like_count: number;
    dislike_count: number;
    net_score: number;
  };
  userReaction?: 'like' | 'dislike' | null;
}

// 课评列表响应
export interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 获取课评列表
export const getReviews = async (params?: {
  page?: number;
  limit?: number;
  course_id?: number;
  offering_id?: number;
  author_id?: number;
  search?: string;
}): Promise<ApiResponse<ReviewsResponse>> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.course_id) queryParams.append('course_id', params.course_id.toString());
  if (params?.offering_id) queryParams.append('offering_id', params.offering_id.toString());
  if (params?.author_id) queryParams.append('author_id', params.author_id.toString());
  if (params?.search) queryParams.append('search', params.search);

  const queryString = queryParams.toString();
  const endpoint = `/reviews/${queryString ? `?${queryString}` : ''}`;
  
  return apiCall<ReviewsResponse>(endpoint, {
    method: 'GET',
  }, false);
};

// 获取课评详情
export const getReview = async (reviewId: number): Promise<ApiResponse<Review>> => {
  return apiCall<Review>(`/reviews/${reviewId}`, {
    method: 'GET',
  }, false);
};

// 创建课评
export interface CreateReviewParams {
  course_id: number;
  offering_id?: number;
  rating_overall?: number;
  rating_difficulty?: number;
  rating_workload?: number;
  rating_teaching?: number;
  title?: string;
  content?: string;
  is_anonymous?: boolean;
  course_code?: string;
  instructor?: string;
}

// 点赞/点踩课评
export const reactToReview = async (
  reviewId: number,
  reaction: 'like' | 'dislike'
): Promise<ApiResponse<{ reaction: 'like' | 'dislike' | null; stats: any }>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const authHeaders = getAuthHeaders();
  Object.assign(headers, authHeaders);

  try {
    const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/reactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reaction }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to react to review:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to react to review',
    };
  }
};

export const createReview = async (params: CreateReviewParams): Promise<ApiResponse<Review>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const authHeaders = getAuthHeaders();
  Object.assign(headers, authHeaders);

  try {
    const response = await fetch(`${API_BASE_URL}/reviews/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        course_id: params.course_id,
        offering_id: params.offering_id,
        rating_overall: params.rating_overall,
        rating_difficulty: params.rating_difficulty,
        rating_workload: params.rating_workload,
        rating_teaching: params.rating_teaching,
        title: params.title,
        content: params.content,
        is_anonymous: params.is_anonymous || false,
      }),
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

// 更新课评
export interface UpdateReviewParams {
  rating_overall?: number;
  rating_difficulty?: number;
  rating_workload?: number;
  rating_teaching?: number;
  title?: string;
  content?: string;
  is_anonymous?: boolean;
}

export const updateReview = async (reviewId: number, params: UpdateReviewParams): Promise<ApiResponse<Review>> => {
  return apiCall<Review>(`/reviews/${reviewId}`, {
    method: 'PUT',
    body: JSON.stringify(params),
  }, true);
};

// 删除课评
export const deleteReview = async (reviewId: number): Promise<ApiResponse<any>> => {
  return apiCall<any>(`/reviews/${reviewId}`, {
    method: 'DELETE',
  }, true);
};

