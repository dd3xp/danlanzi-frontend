import React from 'react';
import { useTranslation } from 'next-i18next';
import styles from '../styles/UserMenu.module.css';

interface UserMenuProps {
  onLogout: () => void;
}

export default function UserMenu({ onLogout }: UserMenuProps) {
  const { t } = useTranslation('common');

  return (
    <div className={styles.menu} role="menu" aria-label={t('userMenu.ariaLabel', 'User menu')}>
      <button
        type="button"
        className={styles.menuItem}
        role="menuitem"
        onClick={onLogout}
        aria-label={t('userMenu.logout')}
      >
        {t('userMenu.logout')}
      </button>
    </div>
  );
}


