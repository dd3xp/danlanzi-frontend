// 课程相关API服务
import { apiCall, ApiResponse } from '../utils/apiClient';

// 课程目录类型
export interface Course {
  id: number;
  code: string;
  name: string;
  dept?: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  offerings?: CourseOffering[];
}

// 开课实例类型
export interface CourseOffering {
  id: number;
  course_id: number;
  term: string;
  section?: string;
  instructor?: string | string[]; // 支持字符串或字符串数组
  schedule_json?: any;
  extra_info?: string;
  created_at: string;
  course?: Course;
}

// 课程列表响应
export interface CoursesResponse {
  courses: Course[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 开课实例列表响应
export interface OfferingsResponse {
  offerings: CourseOffering[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 获取所有课程目录
export const getCourses = async (params?: {
  page?: number;
  limit?: number;
  dept?: string;
  search?: string;
}): Promise<ApiResponse<CoursesResponse>> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.dept) queryParams.append('dept', params.dept);
  if (params?.search) queryParams.append('search', params.search);

  const queryString = queryParams.toString();
  const endpoint = `/course/courses${queryString ? `?${queryString}` : ''}`;
  
  return apiCall<CoursesResponse>(endpoint, {
    method: 'GET',
  }, false);
};

// 获取单个课程详情
export const getCourse = async (id: number): Promise<ApiResponse<{ course: Course }>> => {
  return apiCall<{ course: Course }>(`/course/courses/${id}`, {
    method: 'GET',
  }, false);
};

// 获取所有开课实例
export const getOfferings = async (params?: {
  page?: number;
  limit?: number;
  course_id?: number;
  term?: string;
  instructor?: string;
}): Promise<ApiResponse<OfferingsResponse>> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.course_id) queryParams.append('course_id', params.course_id.toString());
  if (params?.term) queryParams.append('term', params.term);
  if (params?.instructor) queryParams.append('instructor', params.instructor);

  const queryString = queryParams.toString();
  const endpoint = `/course/offerings${queryString ? `?${queryString}` : ''}`;
  
  return apiCall<OfferingsResponse>(endpoint, {
    method: 'GET',
  }, false);
};

// 获取单个开课实例详情
export const getOffering = async (id: number): Promise<ApiResponse<{ offering: CourseOffering }>> => {
  return apiCall<{ offering: CourseOffering }>(`/course/offerings/${id}`, {
    method: 'GET',
  }, false);
};

// 获取课程统计信息
export const getCourseStats = async (): Promise<ApiResponse<{
  totalCourses: number;
  totalOfferings: number;
  coursesByDept: Array<{ dept: string; count: number }>;
  offeringsByTerm: Array<{ term: string; count: number }>;
}>> => {
  return apiCall(`/course/stats`, {
    method: 'GET',
  }, false);
};

// 创建课程目录
export const createCourse = async (params: {
  code: string;
  name: string;
  dept?: string;
  description?: string;
}): Promise<ApiResponse<{ course: Course }>> => {
  return apiCall<{ course: Course }>(`/course/courses`, {
    method: 'POST',
    body: JSON.stringify(params),
  }, true);
};

