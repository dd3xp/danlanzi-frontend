import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import styles from '@/styles/global/Avatar.module.css';
import UserMenu from '@/components/global/UserMenu';
import { logout, getToken } from '@/utils/auth';
import { useRouter } from 'next/router';
import { getUserProfile } from '@/services/userProfileService';
import { getUserAvatar } from '@/services/userAvatarService';
import { eventBus, EVENTS } from '@/utils/eventBus';

// 全局状态，在组件外部定义，避免重新挂载时重置
let globalUserProfile: any = null;

export default function Avatar() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(globalUserProfile);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 初始加载
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken();
        if (!token) return;

        // 获取用户资料
        const profileResponse = await getUserProfile();
        if (profileResponse.status === 'success' && profileResponse.user) {
          const profile = profileResponse.user;
          
          // 获取用户头像
          const avatarResponse = await getUserAvatar(profile.id);
          if (avatarResponse.status === 'success' && avatarResponse.avatar_data_url) {
            // 合并头像数据到用户资料中
            globalUserProfile = {
              ...profile,
              avatar_data_url: avatarResponse.avatar_data_url
            };
          } else {
            globalUserProfile = profile;
          }
          setUserProfile(globalUserProfile);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    // 先同步全局状态，这样如果有数据就立即显示
    setUserProfile(globalUserProfile);
    
    // 如果没有全局数据，才去获取
    if (!globalUserProfile) {
      fetchData();
    }
  }, []);

  // 监听头像更新事件
  useEffect(() => {
    const updateAvatar = async () => {
      try {
        const profileResponse = await getUserProfile();
        if (profileResponse.status === 'success' && profileResponse.user) {
          const profile = profileResponse.user;
          const avatarResponse = await getUserAvatar(profile.id);
          if (avatarResponse.status === 'success' && avatarResponse.avatar_data_url) {
            globalUserProfile = {
              ...profile,
              avatar_data_url: avatarResponse.avatar_data_url
            };
          } else {
            globalUserProfile = profile;
          }
          // 更新完全局变量后，立即更新组件状态
          setUserProfile(globalUserProfile);
        }
      } catch (error) {
        console.error('Failed to update avatar:', error);
      }
    };

    const unsubscribe = eventBus.subscribe(EVENTS.AVATAR_UPDATED, updateAvatar);
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
    // 清除全局状态
    globalUserProfile = null;
    setUserProfile(null);
    setOpen(false);
    router.push('/user/login');
  };

  // 获取显示内容：优先头像，其次昵称首字母，最后显示占位符
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
        <UserMenu 
          onLogout={handleLogout} 
          userProfile={userProfile}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
