import React from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import styles from '../../styles/Login.module.css';

export default function Login() {
  const { t } = useTranslation('common');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 暂时不实现功能
    console.log('登录表单提交');
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <div className={styles.logoContainer}>
            <img 
              src="/danlanzi.svg" 
              alt={t('logoAlt')} 
              className={styles.logo}
            />
          </div>
          <p className={styles.loginSubtitle}>{t('login.subtitle')}</p>
        </div>

        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="username" className={styles.inputLabel}>
              {t('login.username')}
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className={styles.inputField}
              placeholder={t('login.usernamePlaceholder')}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.inputLabel}>
              {t('login.password')}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className={styles.inputField}
              placeholder={t('login.passwordPlaceholder')}
              required
            />
          </div>

          <div className={styles.optionsGroup}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" className={styles.checkbox} />
              <span className={styles.checkboxText}>{t('login.rememberMe')}</span>
            </label>
            <a href="#" className={styles.forgotLink}>
              {t('login.forgotPassword')}
            </a>
          </div>

          <button type="submit" className={styles.loginButton}>
            {t('login.loginButton')}
          </button>
        </form>

        <div className={styles.loginFooter}>
          <p className={styles.signupText}>
            {t('login.noAccount')}{' '}
            <a href="#" className={styles.signupLink}>
              {t('login.signup')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'zh', ['common'])),
  },
});
