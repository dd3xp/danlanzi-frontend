import React, { useEffect, useState } from 'react';
import SideBar from '@/components/global/SideBar';
import Avatar from '@/components/global/Avatar';
import ProtectedRoute from '@/components/global/ProtectedRoute';
import ProfileCard from '@/components/profile/ProfileCard';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import styles from '@/styles/profile/Profile.module.css';
import { getUserProfile } from '@/services/userProfileService';
import { getUserAvatar } from '@/services/userAvatarService';
import { useRouter } from 'next/router';
import { getUser } from '@/utils/auth';

export default function UserProfilePage() {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'messages'>('overview');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const currentUser = getUser();

  useEffect(() => {
    let isSubscribed = true;
    const load = async () => {
      if (!router.isReady) return;

      // 每次路由变化时重置用户数据
      setUser(null);
      
      const userId = typeof router.query.id === 'string' ? router.query.id : undefined;
      const res = await getUserProfile(userId);
      if (!isSubscribed) return;
      
      if (res.status === 'success' && res.user) {
        const profile = res.user;
        const avatarRes = await getUserAvatar(profile.id);
        if (!isSubscribed) return;
        
        if (avatarRes.status === 'success' && avatarRes.avatar_data_url) {
          profile.avatar_data_url = avatarRes.avatar_data_url;
        }
        
        setUser(profile);
      }
    };
    
    load();

    // 清理函数
    return () => {
      isSubscribed = false;
    };
  }, [router.isReady, router.asPath]);


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
              <ProfileCard 
                user={user} 
                onUserUpdate={setUser}
                isCurrentUser={!router.query.id || (!!currentUser && currentUser.id === user.id)}
              />
            )}
            {activeTab === 'resources' && (
              <>
                <h2 className={styles.sectionTitle}>{t('userProfile.sections.resources')}</h2>
                <p className={styles['text-muted']}>{t('userProfile.placeholders.noResources')}</p>
              </>
            )}
            {activeTab === 'messages' && (
              <>
                <h2 className={styles.sectionTitle}>{t('userProfile.sections.messages')}</h2>
                <p className={styles['text-muted']}>{t('userProfile.placeholders.noMessages')}</p>
              </>
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


