import React, { useState, useEffect, useRef } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import styles from '@/styles/register/Register.module.css';
import { getToken } from '../../utils/auth';
import { sendVerificationCode, verifyCode, resetPassword, getSecurityEmail } from '../../services/authService';
import { translateBackendMessage } from '../../utils/translator';
import ErrorMessage from '@/components/global/ErrorMessage';
import { showToast } from '@/components/global/Toast';

export default function ForgotPassword() {
  const { t } = useTranslation(['common', 'messages']);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    student_id: '',
    security_email: '',
    verificationCode: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [countdown, setCountdown] = useState(0);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'student_id' | 'reset'>('student_id');

  useEffect(() => {
    if (getToken()) {
      router.replace('/user');
    }
    setIsCheckingAuth(false);
  }, [router]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 页面加载时恢复倒计时状态
  useEffect(() => {
    const savedCountdown = localStorage.getItem('reset_password_countdown');
    const savedTimestamp = localStorage.getItem('reset_password_countdown_timestamp');
    
    if (savedCountdown && savedTimestamp) {
      const elapsed = Math.floor((Date.now() - parseInt(savedTimestamp)) / 1000);
      const remaining = Math.max(0, parseInt(savedCountdown) - elapsed);
      
      if (remaining > 0) {
        setCountdown(remaining);
        
        timerRef.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              localStorage.removeItem('reset_password_countdown');
              localStorage.removeItem('reset_password_countdown_timestamp');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        localStorage.removeItem('reset_password_countdown');
        localStorage.removeItem('reset_password_countdown_timestamp');
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const validateStudentId = () => {
    if (!formData.student_id.trim()) {
      setErrors(prev => ({
        ...prev,
        student_id: t('forgotPassword.errors.studentIdRequired')
      }));
      return false;
    }
    return true;
  };

  const validateResetForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.verificationCode.trim()) {
      newErrors.verificationCode = t('forgotPassword.errors.verificationCodeRequired');
    } else if (formData.verificationCode.trim().length !== 6) {
      newErrors.verificationCode = t('forgotPassword.errors.verificationCodeLength');
    }
    
    if (!formData.password) {
      newErrors.password = t('forgotPassword.errors.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('forgotPassword.errors.passwordMinLength');
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('forgotPassword.errors.confirmPasswordRequired');
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = t('forgotPassword.errors.passwordMismatch');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 第一步：输入学号，获取安全邮箱
  const handleGetSecurityEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStudentId()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await getSecurityEmail(formData.student_id);
      
      if (result.status === 'error') {
        const errorMessage = translateBackendMessage(result, t);
        setErrors(prev => ({
          ...prev,
          student_id: errorMessage || t('forgotPassword.errors.studentIdNotFound')
        }));
        return;
      }

      // 成功获取安全邮箱，进入下一步
      if (result.data && result.data.security_email) {
        setFormData(prev => ({
          ...prev,
          security_email: result.data!.security_email!
        }));
        setStep('reset');
      }
    } catch (error) {
      console.error('获取安全邮箱失败:', error);
      setErrors(prev => ({
        ...prev,
        student_id: t('forgotPassword.errors.networkError')
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // 发送验证码
  const handleSendCode = async () => {
    if (!formData.security_email) {
      return;
    }

    setIsSendingCode(true);
    
    try {
      const sendResult = await sendVerificationCode({
        to: formData.security_email,
        subject: t('forgotPassword.verificationEmail.subject'),
        text: t('forgotPassword.verificationEmail.text'),
        type: 'password_reset'
      });

      if (sendResult.status === 'error') {
        const errorMessage = translateBackendMessage(sendResult, t);
        setErrors(prev => ({
          ...prev,
          verificationCode: errorMessage || t('forgotPassword.errors.sendCodeFailed')
        }));
        return;
      }

      // 发送成功，开始倒计时
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      setCountdown(60);
      localStorage.setItem('reset_password_countdown', '60');
      localStorage.setItem('reset_password_countdown_timestamp', Date.now().toString());
      
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            localStorage.removeItem('reset_password_countdown');
            localStorage.removeItem('reset_password_countdown_timestamp');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      showToast(t('forgotPassword.success.codeSent'), 'success');
    } catch (error) {
      console.error('发送验证码失败:', error);
      setErrors(prev => ({
        ...prev,
        verificationCode: t('forgotPassword.errors.sendCodeFailed')
      }));
    } finally {
      setIsSendingCode(false);
    }
  };

  // 第二步：重置密码
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateResetForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 重置密码（后端会验证验证码）
      const resetResult = await resetPassword({
        student_id: formData.student_id,
        security_email: formData.security_email,
        verificationCode: formData.verificationCode,
        newPassword: formData.password
      });

      if (resetResult.status === 'error') {
        const errorMessage = translateBackendMessage(resetResult, t);
        // 如果是验证码错误，显示在验证码字段
        if (errorMessage.includes('验证码') || errorMessage.includes('verification code') || errorMessage.includes('Invalid or expired')) {
          setErrors(prev => ({
            ...prev,
            verificationCode: errorMessage || t('forgotPassword.errors.invalidCode')
          }));
        } else {
          setErrors(prev => ({
            ...prev,
            general: errorMessage || t('forgotPassword.errors.resetFailed')
          }));
        }
        return;
      }

      // 重置成功，跳转到登录页面
      showToast(t('forgotPassword.success.resetSuccessful'), 'success');
      setTimeout(() => {
        router.push('/user/login');
      }, 1500);
      
    } catch (error) {
      console.error('重置密码失败:', error);
      setErrors(prev => ({
        ...prev,
        general: t('forgotPassword.errors.networkError')
      }));
    } finally {
      setIsSubmitting(false);
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
          <p className={styles.registerSubtitle}>{t('forgotPassword.subtitle')}</p>
        </div>

        {step === 'student_id' ? (
          <form className={styles.registerForm} onSubmit={handleGetSecurityEmail}>
            <ErrorMessage message={errors.general} />
            <div className={styles.inputGroup}>
              <label htmlFor="student_id" className={styles.inputLabel}>
                {t('forgotPassword.studentId')}
              </label>
              <textarea
                id="student_id"
                name="student_id"
                value={formData.student_id}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className={styles.inputField}
                placeholder={t('forgotPassword.studentIdPlaceholder')}
                rows={1}
              />
              <ErrorMessage message={errors.student_id} />
            </div>

            <button type="submit" className={styles.registerButton} disabled={isLoading}>
              {isLoading ? t('forgotPassword.loading.getting') : t('forgotPassword.next')}
            </button>
            
            <ErrorMessage message={errors.general} />

            <div className={styles.registerFooter}>
              <p className={styles.loginText}>
                {t('forgotPassword.rememberPassword')}{' '}
                <a href="/user/login" className={styles.loginLink}>
                  {t('forgotPassword.backToLogin')}
                </a>
              </p>
            </div>
          </form>
        ) : (
          <form className={styles.registerForm} onSubmit={handleResetPassword}>
            <ErrorMessage message={errors.general} />
            
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                {t('forgotPassword.securityEmail')}
              </label>
              <div className={styles.inputField} style={{ 
                background: 'var(--input-bg)', 
                color: 'var(--text-assist)',
                cursor: 'not-allowed'
              }}>
                {formData.security_email}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-assist)', marginTop: '4px' }}>
                {t('forgotPassword.securityEmailHint')}
              </p>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="verificationCode" className={styles.inputLabel}>
                {t('forgotPassword.verificationCode')}
              </label>
              <div className={styles.codeInputGroup}>
                <textarea
                  id="verificationCode"
                  name="verificationCode"
                  value={formData.verificationCode}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className={styles.codeInputField}
                  placeholder={t('forgotPassword.verificationCodePlaceholder')}
                  rows={1}
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || isSendingCode}
                  className={styles.sendCodeButton}
                >
                  {isSendingCode ? t('forgotPassword.sending') : (countdown > 0 ? `${countdown}s` : t('forgotPassword.sendCode'))}
                </button>
              </div>
              <ErrorMessage message={errors.verificationCode} />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.inputLabel}>
                {t('forgotPassword.newPassword')}
              </label>
              <textarea
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className={styles.inputField}
                placeholder={t('forgotPassword.newPasswordPlaceholder')}
                rows={1}
              />
              <ErrorMessage message={errors.password} />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.inputLabel}>
                {t('forgotPassword.confirmPassword')}
              </label>
              <textarea
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className={styles.inputField}
                placeholder={t('forgotPassword.confirmPasswordPlaceholder')}
                rows={1}
              />
              <ErrorMessage message={errors.confirmPassword} />
            </div>

            <button type="submit" className={styles.registerButton} disabled={isSubmitting}>
              {isSubmitting ? t('forgotPassword.loading.resetting') : t('forgotPassword.resetButton')}
            </button>
            
            <ErrorMessage message={errors.general} />

            <div className={styles.registerFooter}>
              <p className={styles.loginText}>
                {t('forgotPassword.rememberPassword')}{' '}
                <a href="/user/login" className={styles.loginLink}>
                  {t('forgotPassword.backToLogin')}
                </a>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'zh', ['common', 'messages'])),
  },
});

