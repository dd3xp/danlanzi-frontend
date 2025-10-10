import SideBar from '@/components/SideBar';
import Avatar from '@/components/Avatar';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function Home() {
  return (
    <>
      <SideBar />
      <Avatar />
      <main className="app-main" />
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'zh', ['common'])), // 默认语言调整
  },
});
