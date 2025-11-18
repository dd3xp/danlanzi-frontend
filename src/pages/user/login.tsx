import React, { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import styles from '@/styles/login/Login.module.css';
import { loginUser } from '../../services/authService';
import { setToken, setUser, getToken } from '../../utils/auth';
import { translateBackendMessage } from '../../utils/translator';
import { getUserProfile } from '@/services/userProfileService';
import ErrorMessage from '@/components/global/ErrorMessage';
import { setStoredTheme, Theme } from '@/utils/themeManager';
import { showToast } from '@/components/global/Toast';

export default function Login() {
  const { t } = useTranslation(['common', 'messages']);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    student_id: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.replace('/user');
    }
    setIsCheckingAuth(false);
  }, [router]);

  // 检查URL参数中的注册成功消息
  useEffect(() => {
    const { message } = router.query;
    if (message === 'registration_success') {
      showToast(t('auth.success.registrationSuccessful', { ns: 'messages' }), 'success');
    }
  }, [router.query, t]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.student_id.trim()) {
      newErrors.student_id = t('login.errors.studentIdRequired');
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
        student_id: formData.student_id,
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
        setToken(loginResult.token, rememberMe);
        setUser(loginResult.user, rememberMe);
        
        showToast(t('auth.success.loginSuccessful', { ns: 'messages' }), 'success');
        
        // 获取用户资料，检查语言和主题设置
        const profileRes = await getUserProfile();
        if (profileRes.status === 'success') {
          // 设置主题
          if (profileRes.user?.theme) {
            setStoredTheme(profileRes.user.theme as Theme);
          }

          // 检查语言设置
          if (profileRes.user?.language && profileRes.user.language !== router.locale) {
            // 跳转到主页，同时设置语言
            const language = profileRes.user.language || 'zh-CN';
            router.push('/user', undefined, { locale: language });
          } else {
            // 如果没有语言设置或语言相同，直接跳转到主页
            router.push('/user');
          }
        } else {
          // 如果获取用户资料失败，直接跳转到主页
          router.push('/user');
        }
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

  if (isCheckingAuth) {
    return null;
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <div className={styles.logoContainer}>
            <img 
              src="/danlanzi.png" 
              alt={t('logoAlt')} 
              className={styles.logo}
            />
          </div>
          <p className={styles.loginSubtitle}>{t('login.subtitle')}</p>
        </div>

        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="student_id" className={styles.inputLabel}>
              {t('login.username')}
            </label>
            <textarea
              id="student_id"
              name="student_id"
              value={formData.student_id}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className={styles.inputField}
              placeholder={t('login.usernamePlaceholder')}
              rows={1}
            />
            <ErrorMessage message={errors.student_id} />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.inputLabel}>
              {t('login.password')}
            </label>
            <textarea
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className={styles.inputField}
              placeholder={t('login.passwordPlaceholder')}
              rows={1}
            />
            <ErrorMessage message={errors.password} />
          </div>

          <div className={styles.optionsGroup}>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                className={styles.checkbox}
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className={styles.checkboxText}>{t('login.rememberMe')}</span>
            </label>
            <a href="/user/forgot-password" className={styles.forgotLink}>
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
