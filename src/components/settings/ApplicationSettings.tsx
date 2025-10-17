import React from 'react';
import { Select } from 'antd';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import styles from '@/styles/settings/ApplicationSettings.module.css';

export default function ApplicationSettings() {
  const { t } = useTranslation('common');
  const router = useRouter();

  return (
    <div className={styles.settingGroup}>
      <div className={styles.settingSection}>
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
                value={router.isReady ? router.locale || 'zh' : 'zh'}
                onChange={(value) => {
                  if (router.isReady) {
                    router.push(router.pathname, router.asPath, { locale: value });
                  }
                }}
                options={[
                  { value: 'zh', label: '简体中文' },
                  { value: 'en', label: 'English' }
                ]}
                popupMatchSelectWidth
                disabled={!router.isReady}
                showSearch={false}
                listHeight={200}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
