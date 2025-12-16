// 通知相关API服务
import { apiCall, ApiResponse } from '../utils/apiClient';

const API_BASE_URL = '/notifications';

// 通知接口
export interface Notification {
  id: number;
  user_id: number;
  type: 'system' | 'resource' | 'review' | 'comment' | 'announcement';
  title?: string;
  content?: string;
  entity_type?: string;
  entity_id?: number;
  is_read: boolean;
  created_at: string;
}

// 通知列表响应
export interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 获取通知列表参数
export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  is_read?: boolean;
  type?: 'system' | 'resource' | 'review' | 'comment' | 'announcement';
  exclude_type?: 'system' | 'resource' | 'review' | 'comment' | 'announcement';
}

// 获取通知列表
export const getNotifications = async (params?: GetNotificationsParams): Promise<ApiResponse<NotificationsResponse>> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.is_read !== undefined) queryParams.append('is_read', params.is_read.toString());
  if (params?.type) queryParams.append('type', params.type);
  if (params?.exclude_type) queryParams.append('exclude_type', params.exclude_type);

  const queryString = queryParams.toString();
  const endpoint = `${API_BASE_URL}${queryString ? `?${queryString}` : ''}`;
  
  return apiCall<NotificationsResponse>(endpoint, {
    method: 'GET',
  }, true);
};

// 获取未读通知数量
export const getUnreadCount = async (): Promise<ApiResponse<{ count: number }>> => {
  return apiCall<{ count: number }>(`${API_BASE_URL}/unread-count`, {
    method: 'GET',
  }, true);
};

// 获取单个通知详情
export const getNotification = async (id: number): Promise<ApiResponse<{ notification: Notification }>> => {
  return apiCall<{ notification: Notification }>(`${API_BASE_URL}/${id}`, {
    method: 'GET',
  }, true);
};

// 标记通知为已读
export const markAsRead = async (id: number): Promise<ApiResponse<{ notification: Notification }>> => {
  return apiCall<{ notification: Notification }>(`${API_BASE_URL}/${id}/read`, {
    method: 'PUT',
  }, true);
};

// 标记所有通知为已读
export const markAllAsRead = async (): Promise<ApiResponse<{ updatedCount: number }>> => {
  return apiCall<{ updatedCount: number }>(`${API_BASE_URL}/read-all`, {
    method: 'PUT',
  }, true);
};

// 删除通知
export const deleteNotification = async (id: number): Promise<ApiResponse<void>> => {
  return apiCall<void>(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  }, true);
};
