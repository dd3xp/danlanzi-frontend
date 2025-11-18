import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import ProtectedRoute from '@/components/global/ProtectedRoute';
import SideBar from '@/components/global/SideBar';
import Avatar from '@/components/global/Avatar';
import ApplicationSettings from '@/components/settings/ApplicationSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import styles from '@/styles/settings/Settings.module.css';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      className={`${styles.tabPanel} ${value !== index ? styles.hidden : ''}`}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <div>{children}</div>}
    </div>
  );
}

function Settings() {
  const { t } = useTranslation('common');
  const router = useRouter();
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
          <div className={styles.tabs} role="tablist" aria-label={t('settings.tabs.ariaLabel')}>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 0}
              className={`${styles.tab} ${activeTab === 0 ? styles.active : ''}`}
              onClick={() => handleTabChange(0)}
            >
              {t('settings.tabs.application')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 1}
              className={`${styles.tab} ${activeTab === 1 ? styles.active : ''}`}
              onClick={() => handleTabChange(1)}
            >
              {t('settings.tabs.security')}
            </button>
          </div>

          <section className={styles.tabPanel} role="tabpanel">
            {activeTab === 0 && <ApplicationSettings />}
            {activeTab === 1 && <SecuritySettings />}
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

export default Settings;
