// 举报和审核管理相关API服务
import { apiCall, ApiResponse } from '../utils/apiClient';

// 举报接口
export interface Report {
  id: number;
  entity_type: 'resource' | 'review' | 'resource_comment' | 'review_comment';
  entity_id: number;
  reporter_id: number;
  reason: string;
  details?: string;
  status: 'pending' | 'handled';
  created_at: string;
  reporter?: {
    id: number;
    nickname: string;
    email: string;
    student_id?: string;
  };
}

// 审核队列项接口
export interface ModerationQueueItem {
  id: number;
  entity_type: 'resource' | 'review' | 'resource_comment' | 'review_comment';
  entity_id: number;
  report_count: number;
  status: 'pending' | 'approved' | 'rejected' | 'removed' | 'pending_review';
  notes?: string;
  handled_by?: number;
  handled_at?: string;
  created_at: string;
  updated_at?: string;
  handler?: {
    id: number;
    nickname: string;
    email: string;
  };
}

// 获取举报列表参数
export interface GetReportsParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'handled';
  entity_type?: 'resource' | 'review' | 'resource_comment' | 'review_comment';
  reason?: string;
  reporter_id?: number;
}

// 获取举报列表响应
export interface GetReportsResponse {
  reports: Report[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 获取审核队列列表参数
export interface GetModerationQueueParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'removed' | 'pending_review';
  entity_type?: 'resource' | 'review' | 'resource_comment' | 'review_comment';
  sort_by?: 'report_count' | 'created_at' | 'updated_at';
  sort_order?: 'ASC' | 'DESC';
}

// 获取审核队列列表响应
export interface GetModerationQueueResponse {
  items: ModerationQueueItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 创建审核队列项参数
export interface CreateModerationQueueItemParams {
  entity_type: 'resource' | 'review' | 'resource_comment' | 'review_comment';
  entity_id: number;
  notes?: string;
}

// 处理审核项参数
export interface HandleModerationItemParams {
  status: 'pending' | 'approved' | 'rejected' | 'removed' | 'pending_review';
  action?: 'hide'; // 仅用于资源，表示隐藏
  notes?: string;
}

// 审核统计信息
export interface ModerationStats {
  queue: {
    pending: number;
    pending_review?: number;
    approved: number;
    rejected: number;
    removed: number;
  };
  reports: {
    pending: number;
    handled: number;
  };
}

// 获取举报列表（管理员）
export const getReports = async (params?: GetReportsParams): Promise<ApiResponse<GetReportsResponse>> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.entity_type) queryParams.append('entity_type', params.entity_type);
  if (params?.reason) queryParams.append('reason', params.reason);
  if (params?.reporter_id) queryParams.append('reporter_id', params.reporter_id.toString());
  
  const queryString = queryParams.toString();
  const endpoint = `/moderation/reports${queryString ? `?${queryString}` : ''}`;
  
  return apiCall<GetReportsResponse>(endpoint, {
    method: 'GET',
  }, true);
};

// 获取单个举报详情（管理员）
export const getReport = async (id: number): Promise<ApiResponse<{ report: Report }>> => {
  return apiCall<{ report: Report }>(`/moderation/reports/${id}`, {
    method: 'GET',
  }, true);
};

// 更新举报状态（管理员）
export const updateReportStatus = async (id: number, status: 'pending' | 'handled'): Promise<ApiResponse<{ report: Report }>> => {
  return apiCall<{ report: Report }>(`/moderation/reports/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }, true);
};

// 获取审核队列列表（管理员）
export const getModerationQueue = async (params?: GetModerationQueueParams): Promise<ApiResponse<GetModerationQueueResponse>> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.entity_type) queryParams.append('entity_type', params.entity_type);
  if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
  
  const queryString = queryParams.toString();
  const endpoint = `/moderation/moderation-queue${queryString ? `?${queryString}` : ''}`;
  
  return apiCall<GetModerationQueueResponse>(endpoint, {
    method: 'GET',
  }, true);
};

// 手动创建审核队列项（管理员）
export const createModerationQueueItem = async (params: CreateModerationQueueItemParams): Promise<ApiResponse<{ item: ModerationQueueItem }>> => {
  return apiCall<{ item: ModerationQueueItem }>('/moderation/moderation-queue', {
    method: 'POST',
    body: JSON.stringify(params),
  }, true);
};

// 处理审核项（管理员）
export const handleModerationItem = async (id: number, params: HandleModerationItemParams): Promise<ApiResponse<{ item: ModerationQueueItem }>> => {
  return apiCall<{ item: ModerationQueueItem }>(`/moderation/moderation-queue/${id}/handle`, {
    method: 'PUT',
    body: JSON.stringify(params),
  }, true);
};

// 获取审核队列项详情（管理员）
export interface GetModerationQueueItemResponse {
  item: ModerationQueueItem;
  reports: Report[];
  entity?: any; // 被举报的实体数据（Resource、Review或Comment）
}

export const getModerationQueueItem = async (id: number): Promise<ApiResponse<GetModerationQueueItemResponse>> => {
  return apiCall<GetModerationQueueItemResponse>(`/moderation/moderation-queue/${id}`, {
    method: 'GET',
  }, true);
};

// 获取审核统计信息（管理员）
export const getModerationStats = async (): Promise<ApiResponse<{ stats: ModerationStats }>> => {
  return apiCall<{ stats: ModerationStats }>('/moderation/moderation-queue/stats', {
    method: 'GET',
  }, true);
};

// ==================== 用户举报接口 ====================

// 创建举报参数
export interface CreateReportParams {
  entity_type: 'resource' | 'review' | 'resource_comment' | 'review_comment';
  entity_id: number;
  reason: 'plagiarism' | 'abuse' | 'spam' | 'other';
  details?: string;
}

// 创建举报（普通用户）
export const createReport = async (params: CreateReportParams): Promise<ApiResponse<{ report: Report }>> => {
  return apiCall<{ report: Report }>('/moderation/reports', {
    method: 'POST',
    body: JSON.stringify(params),
  }, true);
};

// 删除举报记录（管理员）
export const deleteReport = async (id: number): Promise<ApiResponse<{ message: string }>> => {
  return apiCall<{ message: string }>(`/moderation/reports/${id}`, {
    method: 'DELETE',
  }, true);
};

// 删除审核队列项（管理员）
export const deleteModerationQueueItem = async (id: number): Promise<ApiResponse<{ message: string }>> => {
  return apiCall<{ message: string }>(`/moderation/moderation-queue/${id}`, {
    method: 'DELETE',
  }, true);
};

