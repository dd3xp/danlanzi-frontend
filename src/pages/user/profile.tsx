import React, { useEffect, useState } from 'react';
import SideBar from '@/components/SideBar';
import Avatar from '@/components/Avatar';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProfileCard from '@/components/ProfileCard';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import styles from '@/styles/Profile.module.css';
import { getUserProfile } from '@/services/userProfileService';
import { getUserAvatar } from '@/services/userAvatarService';
import { useRouter } from 'next/router';

export default function UserProfilePage() {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'messages'>('overview');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        const userId = typeof router.query.id === 'string' ? router.query.id : undefined;
        const res = await getUserProfile(userId);
        if (res.status === 'success' && res.user) {
          const profile = res.user;
          
          // 获取用户头像
          const avatarRes = await getUserAvatar(profile.id);
          if (avatarRes.status === 'success' && avatarRes.avatar_data_url) {
            profile.avatar_data_url = avatarRes.avatar_data_url;
          }
          
          setUser(profile);
        }
      } catch (e) {
        // 忽略错误，后续可加错误提示
      }
    };
    load();
  }, [router.query.id]);


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
            {activeTab === 'overview' && user && (
              <ProfileCard user={user} onUserUpdate={setUser} />
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
      ...(await serverSideTranslations(locale || 'zh', ['common', 'academic'])),
    },
  };
};


