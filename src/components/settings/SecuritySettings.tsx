import React, { useEffect, useState } from 'react';
import { Button, message } from 'antd';
import { useTranslation } from 'next-i18next';
import styles from '@/styles/settings/SecuritySettings.module.css';
import { getUserProfile, updateUserProfile } from '@/services/userProfileService';
import { sendVerificationCode, verifyCode } from '@/services/verificationService';
import Tooltip from '@/components/global/Tooltip';

export default function SecuritySettings() {
  const { t } = useTranslation('common');
  const [securityEmail, setSecurityEmail] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 加载当前安全邮箱
  useEffect(() => {
    const loadSecurityEmail = async () => {
      try {
        const res = await getUserProfile();
        if (res.status === 'success' && res.user?.security_email) {
          setSecurityEmail(res.user.security_email);
        }
      } catch (error) {
        console.error('Failed to load security email:', error);
      }
    };

    loadSecurityEmail();
  }, []);

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 开始换绑
  const handleStartChange = () => {
    setIsEditing(true);
    setNewEmail('');
    setVerificationCode('');
  };

  // 取消换绑
  const handleCancel = () => {
    setIsEditing(false);
    setNewEmail('');
    setVerificationCode('');
  };

  // 发送验证码
  const handleSendCode = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      message.error(t('settings.security.emailInvalid'));
      return;
    }

    setIsSendingCode(true);
    try {
      const res = await sendVerificationCode(newEmail, 'email_verification');
      if (res.status === 'success') {
        message.success(t('settings.security.codeSent'));
        setCountdown(60); // 60秒倒计时
      } else {
        message.error(res.message || t('settings.security.sendCodeFailed'));
      }
    } catch (error: any) {
      console.error('Send verification code failed:', error);
      message.error(error.message || t('settings.security.sendCodeFailed'));
    } finally {
      setIsSendingCode(false);
    }
  };

  // 提交换绑
  const handleSubmit = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      message.error(t('settings.security.emailInvalid'));
      return;
    }

    if (!verificationCode || verificationCode.length !== 6) {
      message.error(t('settings.security.codeInvalid'));
      return;
    }

    setIsSubmitting(true);
    try {
      // 先验证验证码
      const verifyRes = await verifyCode(newEmail, verificationCode, 'email_verification');
      if (verifyRes.status !== 'success') {
        message.error(verifyRes.message || t('settings.security.codeInvalid'));
        setIsSubmitting(false);
        return;
      }

      // 验证通过后更新安全邮箱
      const updateRes = await updateUserProfile({
        security_email: newEmail
      });

      if (updateRes.status === 'success') {
        message.success(t('settings.security.updateSuccess'));
        setSecurityEmail(newEmail);
        setIsEditing(false);
        setNewEmail('');
        setVerificationCode('');
      } else {
        message.error(updateRes.message || t('settings.security.updateFailed'));
      }
    } catch (error: any) {
      console.error('Update security email failed:', error);
      message.error(error.message || t('settings.security.updateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.settingGroup}>
      <div className={styles.settingSection}>
        <h3 className={styles.settingTitle}>{t('settings.security.title')}</h3>
        <p className={styles.settingDescription}>{t('settings.security.description')}</p>
        
        {!isEditing ? (
          <div className={styles.currentEmailSection}>
            <div className={styles.emailDisplay}>
              <svg className={styles.emailIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <div className={styles.emailInfo}>
                <span className={styles.emailLabel}>{t('settings.security.currentEmail')}</span>
                <span className={styles.emailValue}>{securityEmail || t('settings.security.noEmail')}</span>
              </div>
            </div>
            <Tooltip title={t('settings.security.changeEmail')}>
              <button
                type="button"
                onClick={handleStartChange}
                className={styles.changeButton}
              >
                <svg className={styles.editIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </Tooltip>
          </div>
        ) : (
          <div className={styles.changeEmailSection}>
            <div className={styles.inputGroup}>
              <label htmlFor="newEmail" className={styles.inputLabel}>{t('settings.security.newEmail')}</label>
              <textarea
                id="newEmail"
                name="newEmail"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={t('settings.security.newEmailPlaceholder')}
                className={styles.emailInput}
                rows={1}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="verificationCode" className={styles.inputLabel}>{t('settings.security.verificationCode')}</label>
              <div className={styles.codeInputGroup}>
                <textarea
                  id="verificationCode"
                  name="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={t('settings.security.codePlaceholder')}
                  className={styles.codeInput}
                  maxLength={6}
                  rows={1}
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || isSendingCode || !newEmail}
                  className={styles.sendCodeButton}
                >
                  {isSendingCode ? t('settings.security.sending') : (countdown > 0 ? `${countdown}s` : t('settings.security.sendCode'))}
                </button>
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <button
                type="button"
                onClick={handleCancel}
                className={styles.cancelButton}
              >
                {t('settings.security.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!newEmail || !verificationCode || verificationCode.length !== 6 || isSubmitting}
                className={styles.submitButton}
              >
                {isSubmitting ? t('settings.security.submitting') : t('settings.security.confirm')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

