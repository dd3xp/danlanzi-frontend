import SideBar from '@/components/SideBar';
import Avatar from '@/components/Avatar';
import Logo from '@/components/Logo';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';

export default function MyCourses() {
  const { t } = useTranslation('common');
  return (
    <>
      <SideBar />
      <Avatar />
      <Logo title={t('sidebar.myCourses')} />
      <main className="app-main" />
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'zh', ['common'])),
  },
});


