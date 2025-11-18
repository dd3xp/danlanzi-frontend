// 认证工具函数

export interface User {
  id: number;
  nickname: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

// 获取存储的token（优先从localStorage，如果没有则从sessionStorage）
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// 设置token（根据rememberMe参数选择存储方式）
export const setToken = (token: string, rememberMe: boolean = false): void => {
  if (typeof window === 'undefined') return;
  if (rememberMe) {
    localStorage.setItem('token', token);
    // 清除sessionStorage中的token（如果存在）
    sessionStorage.removeItem('token');
  } else {
    sessionStorage.setItem('token', token);
    // 清除localStorage中的token（如果存在）
    localStorage.removeItem('token');
  }
};

// 移除token（从两个存储位置都移除）
export const removeToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
};

// 获取用户信息（优先从localStorage，如果没有则从sessionStorage）
export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

// 设置用户信息（根据rememberMe参数选择存储方式）
export const setUser = (user: User, rememberMe: boolean = false): void => {
  if (typeof window === 'undefined') return;
  if (rememberMe) {
    localStorage.setItem('user', JSON.stringify(user));
    // 清除sessionStorage中的user（如果存在）
    sessionStorage.removeItem('user');
  } else {
    sessionStorage.setItem('user', JSON.stringify(user));
    // 清除localStorage中的user（如果存在）
    localStorage.removeItem('user');
  }
};

// 移除用户信息（从两个存储位置都移除）
export const removeUser = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
};

// 检查是否已登录
export const isAuthenticated = (): boolean => {
  const token = getToken();
  const user = getUser();
  return !!(token && user);
};

// 登出
export const logout = (): void => {
  removeToken();
  removeUser();
};

// 获取认证头
export const getAuthHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
