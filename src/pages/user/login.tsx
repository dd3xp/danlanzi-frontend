import React, { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import styles from '@/styles/login/Login.module.css';
import { loginUser } from '../../services/authService';
import { setToken, setUser } from '../../utils/auth';
import { translateBackendMessage } from '../../utils/translator';
import ErrorMessage from '@/components/global/ErrorMessage';

export default function Login() {
  const { t } = useTranslation(['common', 'messages']);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  // 检查URL参数中的注册成功消息
  useEffect(() => {
    const { message } = router.query;
    if (message === 'registration_success') {
      // 可以在这里显示注册成功的提示
    }
  }, [router.query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.email.trim()) {
      newErrors.email = t('login.errors.emailRequired');
    }
    
    if (!formData.password) {
      newErrors.password = t('login.errors.passwordRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const loginResult = await loginUser({
        email: formData.email,
        password: formData.password
      });
      
      if (loginResult.status === 'error') {
        const errorMessage = translateBackendMessage(loginResult, t);
        
        setErrors(prev => ({
          ...prev,
          general: errorMessage
        }));
        return;
      }
      
      // 登录成功，存储token和用户信息
      if (loginResult.status === 'success' && loginResult.user && loginResult.token) {
        setToken(loginResult.token);
        setUser(loginResult.user);
        
        // 跳转到主页或用户想要访问的页面
        const redirectTo = router.query.redirect as string || '/user';
        router.push(redirectTo);
      }
      
    } catch (error) {
      console.error('登录失败:', error);
      setErrors(prev => ({
        ...prev,
        general: t('login.errors.networkError')
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <div className={styles.logoContainer}>
            <img 
              src="/danlanzi.svg" 
              alt={t('logoAlt')} 
              className={styles.logo}
            />
          </div>
          <p className={styles.loginSubtitle}>{t('login.subtitle')}</p>
        </div>

        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.inputLabel}>
              {t('login.username')}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={styles.inputField}
              placeholder={t('login.usernamePlaceholder')}
            />
            <ErrorMessage message={errors.email} />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.inputLabel}>
              {t('login.password')}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={styles.inputField}
              placeholder={t('login.passwordPlaceholder')}
            />
            <ErrorMessage message={errors.password} />
          </div>

          <div className={styles.optionsGroup}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" className={styles.checkbox} />
              <span className={styles.checkboxText}>{t('login.rememberMe')}</span>
            </label>
            <a href="#" className={styles.forgotLink}>
              {t('login.forgotPassword')}
            </a>
          </div>

          <button type="submit" className={styles.loginButton} disabled={isLoading}>
            {isLoading ? t('login.loading.logging') : t('login.loginButton')}
          </button>
          
          <ErrorMessage message={errors.general} />
        </form>

        <div className={styles.loginFooter}>
          <p className={styles.signupText}>
            {t('login.noAccount')}{' '}
            <a href="/user/register" className={styles.signupLink}>
              {t('login.signup')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'zh', ['common', 'messages'])),
  },
});
