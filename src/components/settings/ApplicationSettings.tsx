import React, { useEffect, useState } from 'react';
import { Select, message } from 'antd';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import styles from '@/styles/settings/ApplicationSettings.module.css';
import { updateUserProfile, getUserProfile } from '@/services/userProfileService';

export default function ApplicationSettings() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // 加载用户主题设置
    const loadUserTheme = async () => {
      try {
        const res = await getUserProfile();
        if (res.status === 'success' && res.user?.theme) {
          setTheme(res.user.theme);
          document.documentElement.setAttribute('data-theme', res.user.theme);
        }
      } catch (error) {
        console.error('Failed to load user theme:', error);
      }
    };

    loadUserTheme();
  }, []);

  return (
    <div className={styles.settingGroup}>
      <div className={styles.settingSection}>
        <h3 className={styles.settingTitle}>{t('settings.fields.theme')}</h3>
        <p className={styles.settingDescription}>{t('settings.descriptions.theme')}</p>
        <div className={styles.inlineField}>
          <div className={styles.fieldControl}>
            <svg className={styles.fieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2" />
              <path d="M12 21v2" />
              <path d="M4.22 4.22l1.42 1.42" />
              <path d="M18.36 18.36l1.42 1.42" />
              <path d="M1 12h2" />
              <path d="M21 12h2" />
              <path d="M4.22 19.78l1.42-1.42" />
              <path d="M18.36 5.64l1.42-1.42" />
            </svg>
            <div className={styles.settingSelectWrapper}>
              <Select
                value={theme}
                onChange={async (value) => {
                  try {
                    const res = await updateUserProfile({
                      theme: value
                    });
                    
                    if (res.status === 'success') {
                      setTheme(value);
                      document.documentElement.setAttribute('data-theme', value);
                      message.success(t('messages.updateSuccess'));
                    } else {
                      message.error(t('messages.updateFailed'));
                    }
                  } catch (error) {
                    message.error(t('messages.updateFailed'));
                  }
                }}
                options={[
                  { value: 'light', label: t('settings.theme.light') },
                  { value: 'dark', label: t('settings.theme.dark') },
                  { value: 'auto', label: t('settings.theme.auto') }
                ]}
                popupMatchSelectWidth
                showSearch={false}
                listHeight={200}
                title=""
              />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.settingSection} style={{ marginTop: '32px' }}>
        <h3 className={styles.settingTitle}>{t('settings.fields.language')}</h3>
        <p className={styles.settingDescription}>{t('settings.descriptions.language')}</p>
        <div className={styles.inlineField}>
          <div className={styles.fieldControl}>
            <svg className={styles.fieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <div className={styles.settingSelectWrapper}>
                <Select
                 value={router.isReady ? router.locale || 'zh-CN' : 'zh-CN'}
                onChange={async (value) => {
                  if (router.isReady) {
                    try {
                      const res = await updateUserProfile({
                        language: value
                      });
                      
                          if (res.status === 'success') {
                               const basePath = router.asPath.replace(/^\/[^/]+/, '');
                               router.push(`/user${basePath}`, undefined, { locale: value });
                          } else {
                        message.error(t('messages.updateFailed'));
                      }
                    } catch (error) {
                      message.error(t('messages.updateFailed'));
                    }
                  }
                }}
                options={[
                  { value: 'zh-CN', label: '简体中文' },
                  { value: 'en-US', label: 'English' }
                ]}
                popupMatchSelectWidth
                disabled={!router.isReady}
                showSearch={false}
                listHeight={200}
                title=""
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
