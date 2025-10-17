import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { isAuthenticated } from '@/utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/user/login' 
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setIsAuth(authenticated);
      setIsLoading(false);

      if (!authenticated) {
        // 保存当前页面路径，登录后可以重定向回来
        const currentPath = router.asPath;
        if (currentPath !== '/user/login' && currentPath !== '/user/register') {
          router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
        } else {
          router.push(redirectTo);
        }
      }
    };

    checkAuth();
  }, [router, redirectTo]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#666'
      }}>
        加载中...
      </div>
    );
  }

  if (!isAuth) {
    return null;
  }

  return <>{children}</>;
}
