import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { appWithTranslation } from 'next-i18next';
import { Inter } from 'next/font/google';
import { initializeTheme } from '@/utils/themeManager';
import { getToken } from '@/utils/auth';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const isAuthenticated = !!getToken();
    initializeTheme(isAuthenticated);
  }, []);

  return (
    <div className={inter.variable}>
      <Component {...pageProps} />
    </div>
  );
}

export default appWithTranslation(MyApp);