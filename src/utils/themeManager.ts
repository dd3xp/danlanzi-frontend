import { getUserProfile } from '@/services/userProfileService';

const THEME_KEY = 'dlz-theme';

export type Theme = 'light' | 'dark' | 'auto';

export const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  return (localStorage.getItem(THEME_KEY) as Theme) || 'light';
};

export const setStoredTheme = (theme: Theme) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
};

export const applyTheme = (theme: Theme) => {
  if (typeof window === 'undefined') return;
  
  let effectiveTheme = theme;
  if (theme === 'auto') {
    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  document.documentElement.setAttribute('data-theme', effectiveTheme);
};

export const initializeTheme = async (isAuthenticated: boolean) => {
  if (typeof window === 'undefined') return;

  try {
    if (isAuthenticated) {
      // 如果用户已登录，从服务器获取主题设置
      const res = await getUserProfile();
      if (res.status === 'success' && res.user?.theme) {
        setStoredTheme(res.user.theme as Theme);
        return;
      }
    }
    
    // 如果未登录或获取失败，使用本地存储的主题
    const storedTheme = getStoredTheme();
    applyTheme(storedTheme);
  } catch (error) {
    console.error('Failed to initialize theme:', error);
    // 发生错误时使用本地存储的主题
    applyTheme(getStoredTheme());
  }
};

// 监听系统主题变化
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    const currentTheme = getStoredTheme();
    if (currentTheme === 'auto') {
      applyTheme('auto');
    }
  });
}
