import React from 'react';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import styles from '../styles/UserMenu.module.css';
import { useRouter } from 'next/router';
import Tooltip from './Tooltip';

interface UserMenuProps {
  onLogout: () => void;
  userProfile?: UserProfile | null;
}

interface UserProfile {
  id: number;
  nickname: string;
  email: string;
  student_id?: string;
  avatar_data_url?: string;
  role: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export default function UserMenu({ onLogout, userProfile }: UserMenuProps) {
  const { t } = useTranslation('common');
  const router = useRouter();

  return (
    <div className={styles.menu} role="menu" aria-label={t('userMenu.ariaLabel', 'User menu')}>
      {userProfile && (
        <div className={styles.userInfo}>
          <div className={styles.avatarContainer}>
            {userProfile.avatar_data_url ? (
              <div className={styles.userAvatarWrapper}>
                <Image
                  src={userProfile.avatar_data_url}
                  alt={t('avatar.alt')}
                  fill
                  className={styles.userAvatar}
                />
              </div>
            ) : (
              <div className={styles.userAvatarPlaceholder}>
                {userProfile.nickname?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className={styles.userDetails}>
            <div className={styles.nickname}>{userProfile.nickname}</div>
            {userProfile.student_id && (
              <div className={styles.studentId}>{userProfile.student_id}</div>
            )}
          </div>
          <Tooltip title={t('userMenu.logout')}>
            <button
              type="button"
              className={styles.logoutButton}
              onClick={onLogout}
              aria-label={t('userMenu.logout')}
            >
            <svg
              className={styles.logoutIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            </button>
          </Tooltip>
        </div>
      )}
      <div className={styles.sectionDivider} />
      {/* 菜单项：用户资料 */}
      <button
        type="button"
        className={styles.menuItem}
        role="menuitem"
        aria-label={t('userMenu.profile')}
        onClick={() => router.push('/user/profile')}
      >
        <svg className={styles.menuItemIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="7" r="4" />
          <path d="M6 21c0-3.314 2.686-6 6-6s6 2.686 6 6" />
        </svg>
        {t('userMenu.profile')}
      </button>

      {/* 菜单项：设置 */}
      <button
        type="button"
        className={styles.menuItem}
        role="menuitem"
        aria-label={t('userMenu.settings')}
        onClick={() => router.push('/user/settings')}
      >
        <svg className={styles.menuItemIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .69.28 1.32.73 1.77.45.45 1.08.73 1.77.73H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        {t('userMenu.settings')}
      </button>

      {/* 菜单项：账号安全 */}
      <button
        type="button"
        className={styles.menuItem}
        role="menuitem"
        aria-label={t('userMenu.security')}
        onClick={() => router.push('/user/security')}
      >
        <svg className={styles.menuItemIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V6l-8-4-8 4v6c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        {t('userMenu.security')}
      </button>
    </div>
  );
}


