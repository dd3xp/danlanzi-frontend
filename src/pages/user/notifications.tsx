import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import ProtectedRoute from '@/components/global/ProtectedRoute';
import SideBar from '@/components/global/SideBar';
import Avatar from '@/components/global/Avatar';
import AnnouncementsTab from '@/components/notifications/AnnouncementsTab';
import MessagesTab from '@/components/notifications/MessagesTab';
import styles from '@/styles/notifications/Notifications.module.css';

function Notifications() {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
  };

  return (
    <ProtectedRoute>
      <SideBar />
      <Avatar />
      <main className="app-main">
        <div className={styles.container}>
          <div className={styles.tabs} role="tablist" aria-label={t('notifications.tabs.ariaLabel')}>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 0}
              className={`${styles.tab} ${activeTab === 0 ? styles.active : ''}`}
              onClick={() => handleTabChange(0)}
            >
              {t('notifications.tabs.announcements')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 1}
              className={`${styles.tab} ${activeTab === 1 ? styles.active : ''}`}
              onClick={() => handleTabChange(1)}
            >
              {t('notifications.tabs.messages')}
            </button>
          </div>

          <section className={styles.tabPanel} role="tabpanel">
            {activeTab === 0 && <AnnouncementsTab />}
            {activeTab === 1 && <MessagesTab />}
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};

export default Notifications;
