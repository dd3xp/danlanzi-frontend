import React from 'react';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import styles from '../styles/Avatar.module.css';

export default function Avatar() {
  const { t } = useTranslation('common');
  
  return (
    <div className={styles.avatar}>
      <div className={styles.avatarBorder}>
        <button
          className={styles.iconButton}
          aria-label={t('avatar.ariaLabel')}
          type="button"
          onClick={() => {}}
        >
          <Image
            src="/DefaultAvatar.jpg"
            alt={t('avatar.alt')}
            fill
            className={styles.avatarImage}
          />
        </button>
      </div>
    </div>
  );
}
