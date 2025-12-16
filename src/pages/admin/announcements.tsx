import React, { useEffect, useState } from 'react';
import SideBar from '@/components/global/SideBar';
import Avatar from '@/components/global/Avatar';
import ProtectedRoute from '@/components/global/ProtectedRoute';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import styles from '@/styles/all-courses/AllCourses.module.css';
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  Announcement,
  CreateAnnouncementParams,
  UpdateAnnouncementParams,
} from '@/services/announcementService';
import { showToast } from '@/components/global/Toast';
import ConfirmDialog from '@/components/global/ConfirmDialog';
import Tooltip from '@/components/global/Tooltip';
import AnnouncementModal, { AnnouncementFormData } from '@/components/announcements/AnnouncementModal';

export default function AnnouncementsPage() {
  const { t } = useTranslation('common');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 加载公告列表
  const loadAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        limit: 20,
      };
      const response = await getAnnouncements(params);
      if (response.status === 'success' && response.data) {
        setAnnouncements(response.data.announcements);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        setError(response.message || t('admin.announcements.loadFailed'));
      }
    } catch (err: any) {
      console.error('Failed to load announcements:', err);
      setError(err.message || t('admin.announcements.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, [page]);

  // 处理创建公告
  const handleCreate = () => {
    setSelectedAnnouncement(null);
    setShowModal(true);
  };

  // 处理编辑公告
  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setShowModal(true);
  };

  // 处理删除确认
  const handleDeleteClick = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDeleteConfirm(true);
  };

  // 提交表单
  const handleSubmit = async (formData: AnnouncementFormData) => {
    setSubmitting(true);
    try {
      let response;
      if (selectedAnnouncement) {
        const updateParams: UpdateAnnouncementParams = {
          title: formData.title,
          content: formData.content || undefined,
        };
        response = await updateAnnouncement(selectedAnnouncement.id, updateParams);
      } else {
        const createParams: CreateAnnouncementParams = {
          title: formData.title,
          content: formData.content || undefined,
        };
        response = await createAnnouncement(createParams);
      }

      if (response.status === 'success') {
        showToast(
          selectedAnnouncement
            ? t('admin.announcements.updateSuccess')
            : t('admin.announcements.createSuccess'),
          'success'
        );
        setShowModal(false);
        setSelectedAnnouncement(null);
        loadAnnouncements();
      } else {
        showToast(response.message || t('admin.announcements.operationFailed'), 'error');
      }
    } catch (err: any) {
      console.error('Failed to submit announcement:', err);
      showToast(err.message || t('admin.announcements.operationFailed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!selectedAnnouncement) return;

    setSubmitting(true);
    try {
      const response = await deleteAnnouncement(selectedAnnouncement.id);
      if (response.status === 'success') {
        showToast(t('admin.announcements.deleteSuccess'), 'success');
        setShowDeleteConfirm(false);
        setSelectedAnnouncement(null);
        loadAnnouncements();
      } else {
        showToast(response.message || t('admin.announcements.operationFailed'), 'error');
      }
    } catch (err: any) {
      console.error('Failed to delete announcement:', err);
      showToast(err.message || t('admin.announcements.operationFailed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <ProtectedRoute>
      <SideBar />
      <Avatar />
      <main className="app-main">
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.mainTitle}>{t('admin.announcements.title')}</h1>
            <p className={styles.subTitle}>{t('admin.announcements.subtitle')}</p>
            </div>

          {/* Tab栏 */}
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${styles.active}`}
            >
              {t('admin.announcements.tabs.all')}
            </button>
            <div style={{ flex: 1 }} />
            <Tooltip title={t('admin.announcements.create')}>
            <button
              type="button"
                className={styles.addButton}
              onClick={handleCreate}
                aria-label={t('admin.announcements.create')}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '18px',
                }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                  style={{
                    width: '18px',
                    height: '18px',
                  }}
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            </Tooltip>
          </div>

          {/* 列表 */}
          {loading ? (
            <div className={styles.loadingState}>
              <p className={styles.loadingText}>{t('admin.announcements.loading')}</p>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <p className={styles.errorText}>{error}</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>{t('admin.announcements.noAnnouncements')}</p>
            </div>
          ) : (
            <div className={styles.tabPanel}>
              <div className={styles.courseList}>
              {announcements.map((announcement) => (
                  <div key={announcement.id} className={styles.courseCard}>
                    <div className={styles.courseCardContent}>
                      <div className={styles.courseName}>{announcement.title}</div>
                    {announcement.content && (
                        <div className={styles.courseDept}>{announcement.content}</div>
                      )}
                    </div>
                    <div className={styles.courseCardActions}>
                      <Tooltip title={t('admin.announcements.edit')}>
                    <button
                      type="button"
                          className={styles.reviewButton}
                      onClick={() => handleEdit(announcement)}
                    >
                          <svg
                            className={styles.reviewIcon}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                    </button>
                      </Tooltip>
                      <Tooltip title={t('admin.announcements.delete')}>
                    <button
                      type="button"
                          className={styles.reviewButton}
                      onClick={() => handleDeleteClick(announcement)}
                    >
                          <svg
                            className={styles.reviewIcon}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                    </button>
                      </Tooltip>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '32px', alignItems: 'center' }}>
              <button
                type="button"
                style={{
                  padding: '8px 16px',
                  background: 'var(--card)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '8px',
                  color: 'var(--text)',
                  fontSize: '14px',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  opacity: page === 1 ? 0.5 : 1,
                }}
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                {t('admin.announcements.prevPage')}
              </button>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {t('admin.announcements.pageInfo', { page, totalPages })}
              </span>
              <button
                type="button"
                style={{
                  padding: '8px 16px',
                  background: 'var(--card)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '8px',
                  color: 'var(--text)',
                  fontSize: '14px',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  opacity: page === totalPages ? 0.5 : 1,
                }}
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                {t('admin.announcements.nextPage')}
              </button>
            </div>
          )}

          {/* 创建/编辑模态框 */}
          <AnnouncementModal
            open={showModal}
            onClose={() => {
              setShowModal(false);
              setSelectedAnnouncement(null);
            }}
            onSubmit={handleSubmit}
            initialData={
              selectedAnnouncement
                ? {
                    title: selectedAnnouncement.title,
                    content: selectedAnnouncement.content || '',
                  }
                : null
            }
            submitting={submitting}
          />

          {/* 删除确认对话框 */}
          <ConfirmDialog
            open={showDeleteConfirm}
            title={t('admin.announcements.deleteConfirmTitle')}
            content={t('admin.announcements.deleteConfirmMessage', {
              title: selectedAnnouncement?.title,
            })}
            onOk={handleConfirmDelete}
            onCancel={() => {
              setShowDeleteConfirm(false);
              setSelectedAnnouncement(null);
            }}
            okText={t('admin.announcements.delete')}
            cancelText={t('admin.announcements.cancel')}
            okType="danger"
            loading={submitting}
          />
        </div>
      </main>
    </ProtectedRoute>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'zh-CN', ['common'])),
    },
  };
};

