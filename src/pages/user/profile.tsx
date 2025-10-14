import React, { useState } from 'react';
import SideBar from '@/components/SideBar';
import Avatar from '@/components/Avatar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import styles from '@/styles/Profile.module.css';

export default function UserProfilePage() {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'messages'>('overview');

  return (
    <ProtectedRoute>
      <SideBar />
      <Avatar />
      <main className="app-main">
        <div className={styles.profileContainer}>
          <div className={styles.tabs} role="tablist" aria-label={t('userProfile.tabs.ariaLabel')}>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'overview'}
              className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              {t('userProfile.tabs.overview')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'resources'}
              className={`${styles.tab} ${activeTab === 'resources' ? styles.active : ''}`}
              onClick={() => setActiveTab('resources')}
            >
              {t('userProfile.tabs.resources')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'messages'}
              className={`${styles.tab} ${activeTab === 'messages' ? styles.active : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              {t('userProfile.tabs.messages')}
            </button>
          </div>

          <section className={styles.tabPanel} role="tabpanel">
            {activeTab === 'overview' && (
              <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>{t('userProfile.sections.overview')}</h2>
                <p className={styles.muted}>{t('userProfile.placeholders.noBio')}</p>
              </div>
            )}
            {activeTab === 'resources' && (
              <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>{t('userProfile.sections.resources')}</h2>
                <p className={styles.muted}>{t('userProfile.placeholders.noResources')}</p>
              </div>
            )}
            {activeTab === 'messages' && (
              <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>{t('userProfile.sections.messages')}</h2>
                <p className={styles.muted}>{t('userProfile.placeholders.noMessages')}</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'zh', ['common'])),
    },
  };
};


