// 用户信息相关API服务
import { apiCall, ApiResponse } from '../utils/apiClient';

// 用户信息
interface User {
  id: number;
  nickname: string;
  email: string;
  student_id?: string;
  avatar_path?: string;
  avatar_data_url?: string;
  role: string;
  status: string;
  department?: string;
  major?: string;
  bio?: string;
  security_email?: string;
  theme?: string;
  language?: string;
  show_student_id?: boolean;
  show_department?: boolean;
  show_major?: boolean;
  show_bio?: boolean;
  created_at: string;
  updated_at?: string;
}

// 获取用户信息（可选传入userId以查看他人资料）
export const getUserProfile = async (userId?: string | number): Promise<ApiResponse<User>> => {
  const endpoint = userId ? `/userProfile/profile/${userId}` : '/userProfile/profile';
  return apiCall<User>(endpoint, {
    method: 'GET',
  }, true); // 需要认证
};

// 更新用户资料（包含隐私设置）
export const updateUserProfile = async (profileData: {
  nickname?: string;
  department?: string;
  major?: string;
  bio?: string;
  security_email?: string;
  theme?: string;
  language?: string;
  show_student_id?: boolean;
  show_department?: boolean;
  show_major?: boolean;
  show_bio?: boolean;
}): Promise<ApiResponse<User>> => {
  return apiCall<User>('/userProfile/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  }, true); // 需要认证
};

// 获取公开用户资料
export const getPublicProfile = async (userId: string | number): Promise<ApiResponse<User>> => {
  return apiCall<User>(`/userProfile/profile/${userId}`, {
    method: 'GET',
  }, false);
};

// 获取系统头像列表
export const getSystemAvatars = async (): Promise<ApiResponse<string[]>> => {
  return apiCall<string[]>('/userAvatar/system', {
    method: 'GET',
  }, true);
};


// 错误处理函数
export const handleAPIError = (error: any): string => {
  if (error.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};
