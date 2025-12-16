import SideBar from '@/components/global/SideBar';
import Avatar from '@/components/global/Avatar';
import ProtectedRoute from '@/components/global/ProtectedRoute';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import styles from '@/styles/all-courses/AllCourses.module.css';

export default function UserHome() {
  const { t } = useTranslation('common');
  return (
    <ProtectedRoute>
      <SideBar />
      <Avatar />
      <main className="app-main">
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.mainTitle}>{t('homepage.title')}</h1>
            <p className={styles.subTitle}>{t('homepage.subtitle')}</p>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'zh', ['common'])),
  },
});


