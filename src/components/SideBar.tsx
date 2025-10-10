import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import styles from '../styles/SideBar.module.css';

export default function SideBar() {
  const { t } = useTranslation('common');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <aside className={`${styles.sidebar} ${isExpanded ? styles.expanded : ''}`} role="navigation">
      <button
        className={`${styles.iconButton} ${styles.hamburger}`}
        aria-label="menu"
        type="button"
        onClick={toggleSidebar}
      >
        {/* 汉堡图标（无文字） */}
        <span className={styles.hamburgerLine} />
        <span className={styles.hamburgerLine} />
        <span className={styles.hamburgerLine} />
      </button>
      <button
        className={`${styles.iconButton} ${styles.navItem}`}
        aria-label="homepage"
        type="button"
        onClick={() => {}}
      >
        {/* Homepage图标 */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className={styles.navText}>{t('sidebar.homepage')}</span>
      </button>

      <button
        className={`${styles.iconButton} ${styles.navItem}`}
        aria-label="courses"
        type="button"
        onClick={() => {}}
      >
        {/* 课程板块图标：网格 */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
        </svg>
        <span className={styles.navText}>{t('sidebar.courses')}</span>
      </button>

      <button
        className={`${styles.iconButton} ${styles.navItem}`}
        aria-label="my-courses"
        type="button"
        onClick={() => {}}
      >
        {/* 我的课程图标：书签 */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 3H15C16.1046 3 17 3.89543 17 5V21L10.5 17.5L4 21V5C4 3.89543 4.89543 3 6 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className={styles.navText}>{t('sidebar.myCourses')}</span>
      </button>
    </aside>
  );
}
