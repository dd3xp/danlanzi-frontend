import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import styles from '@/styles/Avatar.module.css';
import UserMenu from '@/components/global/UserMenu';
import { logout, getToken } from '@/utils/auth';
import { useRouter } from 'next/router';
import { getUserProfile } from '@/services/userProfileService';
import { getUserAvatar } from '@/services/userAvatarService';
import { eventBus, EVENTS } from '@/utils/eventBus';

export default function Avatar() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 获取用户信息和头像
  const fetchUserData = async () => {
    try {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      // 获取用户资料
      const profileResponse = await getUserProfile();
      if (profileResponse.status === 'success' && profileResponse.user) {
        const profile = profileResponse.user;
        
        // 获取用户头像
        const avatarResponse = await getUserAvatar(profile.id);
        if (avatarResponse.status === 'success' && avatarResponse.avatar_data_url) {
          // 合并头像数据到用户资料中
          setUserProfile({
            ...profile,
            avatar_data_url: avatarResponse.avatar_data_url
          });
        } else {
          setUserProfile(profile);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchUserData();
  }, []);

  // 监听头像更新事件
  useEffect(() => {
    const unsubscribe = eventBus.subscribe(EVENTS.AVATAR_UPDATED, fetchUserData);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (e.target instanceof Node && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', onDocClick);
    } else {
      document.removeEventListener('mousedown', onDocClick);
    }
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const handleLogout = () => {
    logout();
    setOpen(false);
    router.push('/user/login');
  };

  // 如果正在加载，不显示头像
  if (isLoading) {
    return null;
  }

  // 获取显示内容：优先头像，其次昵称首字母
  const avatarDataUrl = userProfile?.avatar_data_url;
  const displayChar = userProfile?.nickname?.trim()?.charAt(0)?.toUpperCase() || '';

  return (
    <div className={styles.avatar} ref={containerRef}>
      <div className={styles.avatarRing}>
        <div className={styles.avatarWrap}>
          <button
            className={styles.iconButton}
            aria-label={t('avatar.ariaLabel')}
            type="button"
            onClick={() => setOpen((v) => !v)}
          >
            {avatarDataUrl ? (
              <Image
                src={avatarDataUrl}
                alt={t('avatar.alt')}
                fill
                className={styles.avatarImage}
              />
            ) : (
              <div className={styles.avatarFallback}>
                {displayChar}
              </div>
            )}
          </button>
        </div>
      </div>
      {open && (
        <UserMenu onLogout={handleLogout} userProfile={userProfile} />
      )}
    </div>
  );
}
