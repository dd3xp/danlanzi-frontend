import React from 'react';
import { useTranslation } from 'next-i18next';
import styles from '../styles/Logo.module.css';

type LogoProps = {
  title?: string;
};

export default function Logo({ title }: LogoProps) {
  const { t } = useTranslation('common');
  
  return (
    <div className={styles.logoContainer}>
      <img 
        src="/danlanzi.svg" 
        alt={t('logoAlt')} 
        className={styles.logo}
      />
      {title ? <span className={styles.logoTitle}>{title}</span> : null}
    </div>
  );
}
