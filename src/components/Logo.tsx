import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import styles from '../styles/Logo.module.css';

type LogoProps = {
  title?: string;
};

// 全局状态，与SideBar组件共享
let globalSidebarExpanded = false;

export default function Logo({ title }: LogoProps) {
  const { t } = useTranslation('common');
  const [isExpanded, setIsExpanded] = useState(globalSidebarExpanded);
  
  // 监听侧边栏状态变化
  useEffect(() => {
    const checkSidebarState = () => {
      const mainElement = document.querySelector('.app-main');
      const isSidebarExpanded = mainElement?.classList.contains('sidebar-expanded') || false;
      globalSidebarExpanded = isSidebarExpanded;
      setIsExpanded(isSidebarExpanded);
    };
    
    // 初始检查
    checkSidebarState();
    
    // 定期检查侧边栏状态变化
    const interval = setInterval(checkSidebarState, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className={`${styles.logoContainer} ${isExpanded ? styles.sidebarExpanded : ''}`}>
      <img 
        src="/danlanzi.svg" 
        alt={t('logoAlt')} 
        className={styles.logo}
      />
      {title ? <span className={styles.logoTitle}>{title}</span> : null}
    </div>
  );
}
