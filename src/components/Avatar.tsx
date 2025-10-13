import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import styles from '../styles/Avatar.module.css';
import UserMenu from './UserMenu';
import { logout } from '../utils/auth';
import { useRouter } from 'next/router';

export default function Avatar() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <div className={styles.avatar} ref={containerRef}>
      <div className={styles.avatarBorder}>
        <button
          className={styles.iconButton}
          aria-label={t('avatar.ariaLabel')}
          type="button"
          onClick={() => setOpen((v) => !v)}
        >
          <Image
            src="/DefaultAvatar.jpg"
            alt={t('avatar.alt')}
            fill
            className={styles.avatarImage}
          />
        </button>
      </div>
      {open && (
        <UserMenu onLogout={handleLogout} />
      )}
    </div>
  );
}
