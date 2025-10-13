import React, { useState, useEffect, useRef } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import styles from '../../styles/Register.module.css';
import { validateFudanEmail, getEmailValidationError } from '../../utils/emailFormat';

export default function Register() {
  const { t } = useTranslation('common');
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
    verificationCode: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 页面加载时恢复倒计时状态
  useEffect(() => {
    const savedCountdown = localStorage.getItem('register_countdown');
    const savedTimestamp = localStorage.getItem('register_countdown_timestamp');
    
    if (savedCountdown && savedTimestamp) {
      const elapsed = Math.floor((Date.now() - parseInt(savedTimestamp)) / 1000);
      const remaining = Math.max(0, parseInt(savedCountdown) - elapsed);
      
      if (remaining > 0) {
        setCountdown(remaining);
        
        // 恢复定时器
        timerRef.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              // 清除localStorage
              localStorage.removeItem('register_countdown');
              localStorage.removeItem('register_countdown_timestamp');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        // 倒计时已过期，清除localStorage
        localStorage.removeItem('register_countdown');
        localStorage.removeItem('register_countdown_timestamp');
      }
    }
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const validateField = (name: string, value: string) => {
    let error = '';
    
    switch (name) {
      case 'nickname':
        if (!value.trim()) {
          error = t('register.errors.nicknameRequired');
        } else if (value.trim().length < 2) {
          error = t('register.errors.nicknameMinLength');
        }
        break;
      case 'email':
        const emailError = getEmailValidationError(value, t);
        if (emailError) {
          error = emailError;
        }
        break;
      case 'password':
        if (!value) {
          error = t('register.errors.passwordRequired');
        } else if (value.length < 6) {
          error = t('register.errors.passwordMinLength');
        }
        break;
      case 'confirmPassword':
        if (!value) {
          error = t('register.errors.confirmPasswordRequired');
        } else if (value !== formData.password) {
          error = t('register.errors.passwordMismatch');
        }
        break;
      case 'verificationCode':
        if (!value.trim()) {
          error = t('register.errors.verificationCodeRequired');
        } else if (value.trim().length !== 6) {
          error = t('register.errors.verificationCodeLength');
        }
        break;
    }
    
    return error;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除该字段的错误
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // 检查确认密码是否匹配
  const isPasswordMatch = () => {
    return formData.confirmPassword && formData.password && formData.confirmPassword === formData.password;
  };

  // 检查确认密码是否有内容且不匹配
  const isPasswordMismatch = () => {
    return formData.confirmPassword && formData.password && formData.confirmPassword !== formData.password;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证所有字段
    const newErrors: {[key: string]: string} = {};
    let hasErrors = false;
    
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) {
        newErrors[key] = error;
        hasErrors = true;
      }
    });
    
    setErrors(newErrors);
    
    if (!hasErrors) {
      // 暂时不实现功能
      console.log('注册表单提交', formData);
    }
  };

  const handleSendCode = () => {
    // 验证邮箱是否为复旦大学邮箱
    if (!validateFudanEmail(formData.email)) {
      // 如果邮箱验证失败，设置错误信息
      setErrors(prev => ({
        ...prev,
        email: getEmailValidationError(formData.email, t)
      }));
      return;
    }

    // 暂时不实现功能
    console.log('发送验证码到邮箱:', formData.email);
    
    // 清除之前的定时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // 开始倒计时
    setCountdown(60);
    
    // 保存倒计时状态到localStorage
    localStorage.setItem('register_countdown', '60');
    localStorage.setItem('register_countdown_timestamp', Date.now().toString());
    
    // 设置倒计时定时器
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          // 清除localStorage
          localStorage.removeItem('register_countdown');
          localStorage.removeItem('register_countdown_timestamp');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerCard}>
        <div className={styles.registerHeader}>
          <div className={styles.logoContainer}>
            <img 
              src="/danlanzi.svg" 
              alt={t('logoAlt')} 
              className={styles.logo}
            />
          </div>
          <p className={styles.registerSubtitle}>{t('register.subtitle')}</p>
        </div>

        <form className={styles.registerForm} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="nickname" className={styles.inputLabel}>
              {t('register.nickname')}
            </label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              value={formData.nickname}
              onChange={handleInputChange}
              className={styles.inputField}
              placeholder={t('register.nicknamePlaceholder')}
            />
            {errors.nickname && (
              <div className={styles.errorMessage}>
                <svg className={styles.errorIcon} viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.nickname}
              </div>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.inputLabel}>
              {t('register.password')}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={styles.inputField}
              placeholder={t('register.passwordPlaceholder')}
            />
            {errors.password && (
              <div className={styles.errorMessage}>
                <svg className={styles.errorIcon} viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.password}
              </div>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword" className={styles.inputLabel}>
              {t('register.confirmPassword')}
              {isPasswordMatch() && (
                <span className={`${styles.validationIcon} ${styles.success}`}>
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
              {isPasswordMismatch() && (
                <span className={`${styles.validationIcon} ${styles.error}`}>
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={styles.inputField}
              placeholder={t('register.confirmPasswordPlaceholder')}
            />
            {errors.confirmPassword && (
              <div className={styles.errorMessage}>
                <svg className={styles.errorIcon} viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.confirmPassword}
              </div>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.inputLabel}>
              {t('register.email')}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={styles.inputField}
              placeholder={t('register.emailPlaceholder')}
            />
            {errors.email && (
              <div className={styles.errorMessage}>
                <svg className={styles.errorIcon} viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.email}
              </div>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="verificationCode" className={styles.inputLabel}>
              {t('register.verificationCode')}
            </label>
            <div className={styles.codeInputGroup}>
              <input
                type="text"
                id="verificationCode"
                name="verificationCode"
                value={formData.verificationCode}
                onChange={handleInputChange}
                className={styles.codeInputField}
                placeholder={t('register.verificationCodePlaceholder')}
              />
              <button
                type="button"
                onClick={handleSendCode}
                className={styles.sendCodeButton}
                disabled={countdown > 0}
              >
                {countdown > 0 ? `${countdown}s` : t('register.sendCode')}
              </button>
            </div>
            {errors.verificationCode && (
              <div className={styles.errorMessage}>
                <svg className={styles.errorIcon} viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.verificationCode}
              </div>
            )}
          </div>

          <button type="submit" className={styles.registerButton}>
            {t('register.registerButton')}
          </button>
        </form>

        <div className={styles.registerFooter}>
          <p className={styles.loginText}>
            {t('register.haveAccount')}{' '}
            <a href="/user/login" className={styles.loginLink}>
              {t('register.login')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'zh', ['common'])),
  },
});
