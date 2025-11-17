import React, { useState, useEffect, useRef } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import styles from '@/styles/register/Register.module.css';
import { validateFudanEmail, getEmailValidationError } from '../../utils/emailFormat';
import { getToken } from '../../utils/auth';
import { sendVerificationCode, verifyCode, registerUser } from '../../services/authService';
import { translateBackendMessage } from '../../utils/translator';
import ErrorMessage from '@/components/global/ErrorMessage';

export default function Register() {
  const { t } = useTranslation(['common', 'messages']);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
    verificationCode: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [countdown, setCountdown] = useState(0);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.replace('/user');
    }
    setIsCheckingAuth(false);
  }, [router]);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'nickname') {
      // 计算长度：中文字符算2个单位，其他字符算1个单位
      const lengthUnits = Array.from(value).reduce((sum, ch) => 
        sum + (/[\u4e00-\u9fa5]/.test(ch) ? 2 : 1), 0
      );
      // 限制总长度不超过20个单位
      if (lengthUnits > 20) {
        return;
      }
    }
    
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      setIsLoading(true);
      
      try {
        // 先验证验证码
        const verifyResult = await verifyCode({
          email: formData.email,
          code: formData.verificationCode,
          type: 'email_verification'
        });

        // 检查验证码验证结果
        if (verifyResult.status === 'error') {
          const errorMessage = translateBackendMessage(verifyResult, t);
          setErrors(prev => ({
            ...prev,
            verificationCode: errorMessage
          }));
          return;
        }

        // 验证码验证成功，调用注册API
        const registerResult = await registerUser({
          nickname: formData.nickname,
          email: formData.email,
          password: formData.password,
          verificationCode: formData.verificationCode
        });

        // 检查注册结果
        if (registerResult.status === 'error') {
          const errorMessage = translateBackendMessage(registerResult, t);
          setErrors(prev => ({
            ...prev,
            general: errorMessage
          }));
          return;
        }

        // 注册成功，跳转到登录页面
        router.push('/user/login?message=registration_success');
        // 注意：Toast 会在登录页面显示，因为注册后立即跳转
        
      } catch (error) {
        console.error('网络错误:', error);
        setErrors(prev => ({
          ...prev,
          general: t('register.errors.networkError')
        }));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSendCode = async () => {
    // 验证邮箱是否为复旦大学邮箱
    if (!validateFudanEmail(formData.email)) {
      // 如果邮箱验证失败，设置错误信息
      setErrors(prev => ({
        ...prev,
        email: getEmailValidationError(formData.email, t)
      }));
      return;
    }

    setIsSendingCode(true);
    
    try {
      // 发送验证码API调用
      const sendResult = await sendVerificationCode({
        to: formData.email,
        subject: t('register.verificationEmail.registrationVerificationSubject'),
        text: t('register.verificationEmail.registrationVerificationText'),
        type: 'email_verification'
      });

      // 检查发送结果
      if (sendResult.status === 'error') {
        const errorMessage = translateBackendMessage(sendResult, t);
        setErrors(prev => ({
          ...prev,
          email: errorMessage
        }));
        return;
      }

      // 发送成功，清除之前的定时器
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

      // 清除邮箱错误
      setErrors(prev => ({
        ...prev,
        email: ''
      }));

    } catch (error) {
      console.error('网络错误:', error);
      setErrors(prev => ({
        ...prev,
        email: t('register.errors.networkError')
      }));
    } finally {
      setIsSendingCode(false);
    }
  };

  if (isCheckingAuth) {
    return null;
  }

  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerCard}>
        <div className={styles.registerHeader}>
          <div className={styles.logoContainer}>
            <img 
              src="/danlanzi.png" 
              alt={t('logoAlt')} 
              className={styles.logo}
            />
          </div>
          <p className={styles.registerSubtitle}>{t('register.subtitle')}</p>
        </div>

        <form className={styles.registerForm} onSubmit={handleSubmit}>
          <ErrorMessage message={errors.general} />
          <div className={styles.inputGroup}>
            <label htmlFor="nickname" className={styles.inputLabel}>
              {t('register.nickname')}
            </label>
            <textarea
              id="nickname"
              name="nickname"
              value={formData.nickname}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className={styles.inputField}
              placeholder={t('register.nicknamePlaceholder')}
              rows={1}
            />
            <ErrorMessage message={errors.nickname} />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.inputLabel}>
              {t('register.password')}
            </label>
            <textarea
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className={styles.inputField}
              placeholder={t('register.passwordPlaceholder')}
              rows={1}
            />
            <ErrorMessage message={errors.password} />
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
            <textarea
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className={styles.inputField}
              placeholder={t('register.confirmPasswordPlaceholder')}
              rows={1}
            />
            <ErrorMessage message={errors.confirmPassword} />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.inputLabel}>
              {t('register.email')}
            </label>
            <textarea
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className={styles.inputField}
              placeholder={t('register.emailPlaceholder')}
              rows={1}
            />
            <ErrorMessage message={errors.email} />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="verificationCode" className={styles.inputLabel}>
              {t('register.verificationCode')}
            </label>
            <div className={styles.codeInputGroup}>
              <textarea
                id="verificationCode"
                name="verificationCode"
                value={formData.verificationCode}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className={styles.codeInputField}
                placeholder={t('register.verificationCodePlaceholder')}
                rows={1}
              />
              <button
                type="button"
                onClick={handleSendCode}
                className={styles.sendCodeButton}
                disabled={countdown > 0 || isSendingCode}
              >
                {isSendingCode ? t('register.loading.sending') : countdown > 0 ? `${countdown}s` : t('register.sendCode')}
              </button>
            </div>
            <ErrorMessage message={errors.verificationCode} />
          </div>

          <button type="submit" className={styles.registerButton} disabled={isLoading}>
            {isLoading ? t('register.loading.registering') : t('register.registerButton')}
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
    ...(await serverSideTranslations(locale ?? 'zh', ['common', 'messages'])),
  },
});
