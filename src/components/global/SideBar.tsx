import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import styles from '@/styles/global/SideBar.module.css';

// 全局状态，在组件外部定义，避免重新挂载时重置
let globalSidebarExpanded = false;
let globalSidebarHovered = false;

export default function SideBar() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(globalSidebarExpanded);
  const [isHovered, setIsHovered] = useState(globalSidebarHovered);
  
  // 同步全局状态
  useEffect(() => {
    setIsExpanded(globalSidebarExpanded);
    setIsHovered(globalSidebarHovered);
    
    // 初始化时设置主内容区域的类名
    const mainElement = document.querySelector('.app-main');
    if (mainElement) {
      if (globalSidebarExpanded) {
        mainElement.classList.add('sidebar-expanded');
      } else {
        mainElement.classList.remove('sidebar-expanded');
      }
    }
  }, []);

  // 判断当前页面
  const getCurrentPage = () => {
    const path = router.pathname;
    if (path === '/user' || path === '/user/') return 'home';
    if (path === '/user/all-courses') return 'courses';
    if (path === '/user/my-resources') return 'my-resources';
    return null;
  };

  const currentPage = getCurrentPage();
  
  const toggleSidebar = () => {
    globalSidebarExpanded = !globalSidebarExpanded;
    setIsExpanded(globalSidebarExpanded);
    
    // 通知主内容区域侧边栏状态变化
    const mainElement = document.querySelector('.app-main');
    if (mainElement) {
      if (globalSidebarExpanded) {
        mainElement.classList.add('sidebar-expanded');
      } else {
        mainElement.classList.remove('sidebar-expanded');
      }
    }
  };

  const handleNavItemMouseEnter = () => {
    globalSidebarHovered = true;
    setIsHovered(true);
  };

  const handleNavItemMouseLeave = () => {
    globalSidebarHovered = false;
    setIsHovered(false);
  };

  const navigateToPage = (path: string) => {
    router.push(path);
  };
  
  return (
    <aside 
      className={`${styles.sidebar} ${isExpanded ? styles.expanded : ''} ${isHovered ? styles.hovered : ''}`} 
      role="navigation"
    >
      <div className={styles.hamburgerContainer}>
        {/* 未展开且未悬停时显示汉堡菜单 */}
        {!isExpanded && !isHovered && (
          <button
            className={`${styles.iconButton} ${styles.hamburger}`}
            aria-label="menu"
            type="button"
            onClick={toggleSidebar}
          >
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
          </button>
        )}
        {/* 展开状态（不管是否悬停）都显示收回按钮 */}
        {isExpanded && (
          <button
            className={`${styles.iconButton} ${styles.collapseButton}`}
            aria-label="collapse"
            type="button"
            onClick={toggleSidebar}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        {/* 展开或悬停时显示Logo */}
        {(isExpanded || isHovered) && (
          <div className={styles.sidebarLogo}>
            <img 
              src="/danlanzi.png" 
              alt="Logo" 
              className={styles.logoImage}
              loading="eager"
              fetchPriority="high"
            />
            <span className={styles.logoText}>{t('sidebar.brandName')}</span>
          </div>
        )}
      </div>
      <button
        className={`${styles.iconButton} ${styles.navItem} ${currentPage === 'home' ? styles.active : ''}`}
        aria-label="homepage"
        type="button"
        onClick={() => navigateToPage('/user')}
        onMouseEnter={handleNavItemMouseEnter}
        onMouseLeave={handleNavItemMouseLeave}
      >
        {/* Homepage图标 */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className={styles.navText}>{t('sidebar.homepage')}</span>
      </button>

      <button
        className={`${styles.iconButton} ${styles.navItem} ${currentPage === 'courses' ? styles.active : ''}`}
        aria-label="courses"
        type="button"
        onClick={() => navigateToPage('/user/all-courses')}
        onMouseEnter={handleNavItemMouseEnter}
        onMouseLeave={handleNavItemMouseLeave}
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
        className={`${styles.iconButton} ${styles.navItem} ${currentPage === 'my-resources' ? styles.active : ''}`}
        aria-label="my-resources"
        type="button"
        onClick={() => navigateToPage('/user/my-resources')}
        onMouseEnter={handleNavItemMouseEnter}
        onMouseLeave={handleNavItemMouseLeave}
      >
        {/* 资源管理图标：文件夹 */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 7V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V9C21 7.89543 20.1046 7 19 7H12L10 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className={styles.navText}>{t('sidebar.myResources')}</span>
      </button>
    </aside>
  );
}
