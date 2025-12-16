// 公告管理相关API服务
import { apiCall, ApiResponse } from '../utils/apiClient';

// 公告接口
export interface Announcement {
  id: number;
  title: string;
  content?: string;
  priority: number;
  starts_at?: string;
  ends_at?: string;
  status: 'scheduled' | 'active' | 'ended';
  created_by: number;
  created_at: string;
  updated_at?: string;
}

// 创建公告参数
export interface CreateAnnouncementParams {
  title: string;
  content?: string;
  priority?: number;
  starts_at?: string;
  ends_at?: string;
}

// 更新公告参数
export interface UpdateAnnouncementParams {
  title?: string;
  content?: string;
  priority?: number;
  starts_at?: string;
  ends_at?: string;
}

// 获取公告列表参数
export interface GetAnnouncementsParams {
  page?: number;
  limit?: number;
  status?: 'scheduled' | 'active' | 'ended';
}

// 获取公告列表响应
export interface GetAnnouncementsResponse {
  announcements: Announcement[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 获取公告列表
export const getAnnouncements = async (params?: GetAnnouncementsParams): Promise<ApiResponse<GetAnnouncementsResponse>> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);
  
  const queryString = queryParams.toString();
  const endpoint = `/announcements${queryString ? `?${queryString}` : ''}`;
  
  return apiCall<GetAnnouncementsResponse>(endpoint, {
    method: 'GET',
  }, false);
};

// 获取单个公告
export const getAnnouncement = async (id: number): Promise<ApiResponse<{ announcement: Announcement }>> => {
  return apiCall<{ announcement: Announcement }>(`/announcements/${id}`, {
    method: 'GET',
  }, false);
};

// 创建公告（管理员）
export const createAnnouncement = async (params: CreateAnnouncementParams): Promise<ApiResponse<{ announcement: Announcement }>> => {
  return apiCall<{ announcement: Announcement }>('/announcements', {
    method: 'POST',
    body: JSON.stringify(params),
  }, true);
};

// 更新公告（管理员）
export const updateAnnouncement = async (id: number, params: UpdateAnnouncementParams): Promise<ApiResponse<{ announcement: Announcement }>> => {
  return apiCall<{ announcement: Announcement }>(`/announcements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(params),
  }, true);
};

// 删除公告（管理员）
export const deleteAnnouncement = async (id: number): Promise<ApiResponse<void>> => {
  return apiCall<void>(`/announcements/${id}`, {
    method: 'DELETE',
  }, true);
};

// 获取公告阅读者列表（管理员）
export interface GetAnnouncementReadersParams {
  page?: number;
  limit?: number;
}

export interface GetAnnouncementReadersResponse {
  readers: Array<{
    user_id: number;
    read_at: string;
    user?: {
      id: number;
      nickname: string;
      email: string;
      student_id?: string;
    };
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getAnnouncementReaders = async (id: number, params?: GetAnnouncementReadersParams): Promise<ApiResponse<GetAnnouncementReadersResponse>> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  
  const queryString = queryParams.toString();
  const endpoint = `/announcements/${id}/readers${queryString ? `?${queryString}` : ''}`;
  
  return apiCall<GetAnnouncementReadersResponse>(endpoint, {
    method: 'GET',
  }, true);
};

