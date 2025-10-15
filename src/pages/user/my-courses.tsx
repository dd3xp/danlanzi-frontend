import SideBar from '@/components/SideBar';
import Avatar from '@/components/Avatar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';

export default function MyCourses() {
  const { t } = useTranslation('common');
  return (
    <ProtectedRoute>
      <SideBar />
      <Avatar />
      <main className="app-main" />
    </ProtectedRoute>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'zh', ['common'])),
  },
});


