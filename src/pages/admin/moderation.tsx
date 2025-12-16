import React, { useEffect, useState } from 'react';
import SideBar from '@/components/global/SideBar';
import Avatar from '@/components/global/Avatar';
import ProtectedRoute from '@/components/global/ProtectedRoute';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { formatDateTime } from '@/utils/dateUtils';
import styles from '@/styles/all-courses/AllCourses.module.css';
import modalStyles from '@/styles/moderation/ModerationModal.module.css';
import {
  getModerationQueue,
  handleModerationItem,
  getModerationQueueItem,
  ModerationQueueItem,
  HandleModerationItemParams,
  deleteReport,
  deleteModerationQueueItem,
} from '@/services/reportService';
import { showToast } from '@/components/global/Toast';
import ConfirmDialog from '@/components/global/ConfirmDialog';
import Tooltip from '@/components/global/Tooltip';
import ResourceCard from '@/components/resources/ResourceCard';
import ReviewCard from '@/components/reviews/ReviewCard';
import ResourceDetailModal from '@/components/resources/ResourceDetailModal';
import ReviewDetailModal from '@/components/reviews/ReviewDetailModal';
import { Resource, getResources } from '@/services/resourceService';
import { Review, getReview } from '@/services/reviewService';
import { ReviewComment } from '@/services/reviewCommentService';
import { ResourceComment } from '@/services/resourceCommentService';
import Image from 'next/image';
import { getUserAvatar } from '@/services/userAvatarService';

export default function ModerationPage() {
  const { t, i18n } = useTranslation('common');
  const [queueItems, setQueueItems] = useState<ModerationQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [queueStatusFilter, setQueueStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'removed' | 'pending_review' | 'all'>('all');
  const [showHandleModal, setShowHandleModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ModerationQueueItem | null>(null);
  const [handleStatus, setHandleStatus] = useState<'approved' | 'rejected' | 'removed'>('approved');
  const [handleAction, setHandleAction] = useState<'hide' | undefined>(undefined);
  const [handleNotes, setHandleNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [entityData, setEntityData] = useState<Resource | Review | ReviewComment | ResourceComment | null>(null);
  const [loadingEntity, setLoadingEntity] = useState(false);
  const [showEntityDetail, setShowEntityDetail] = useState(false);
  const [sourceEntity, setSourceEntity] = useState<Resource | Review | null>(null); // 评论的来源实体

  // 加载审核队列
  const loadQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        limit: 20,
        sort_by: 'report_count',
        sort_order: 'DESC',
      };
      if (queueStatusFilter !== 'all') {
        params.status = queueStatusFilter;
      }
      const response = await getModerationQueue(params);
      if (response.status === 'success' && response.data) {
        setQueueItems(response.data.items);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        setError(response.message || t('admin.moderation.loadFailed'));
      }
    } catch (err: any) {
      console.error('Failed to load queue:', err);
      setError(err.message || t('admin.moderation.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [page, queueStatusFilter]);

  // 加载被举报实体数据
  const loadEntityData = async (item: ModerationQueueItem) => {
    setLoadingEntity(true);
    setEntityData(null);
    setSourceEntity(null);
    try {
      // 通过审核队列API获取实体信息（后端会返回实体数据）
      const queueResponse = await getModerationQueueItem(item.id);
      if (queueResponse.status === 'success' && queueResponse.data) {
        if (queueResponse.data.entity) {
          setEntityData(queueResponse.data.entity);
          
          // 如果是评论，需要加载来源实体（review或resource）
          if (item.entity_type === 'review_comment' || item.entity_type === 'resource_comment') {
            const comment = queueResponse.data.entity as any;
            // 检查是否已经包含了关联的review或resource
            if (comment.review) {
              // 后端已经返回了关联的review
              setSourceEntity(comment.review);
            } else if (comment.resource) {
              // 后端已经返回了关联的resource
              setSourceEntity(comment.resource);
            } else if ('review_id' in comment && comment.review_id) {
              // 是课评评论但没有关联数据，需要加载
              const reviewResponse = await getReview(comment.review_id);
              if (reviewResponse.status === 'success' && reviewResponse.data) {
                setSourceEntity(reviewResponse.data);
              }
            } else if ('resource_id' in comment && comment.resource_id) {
              // 是资源评论但没有关联数据，需要加载
              const resourceResponse = await getResources({ page: 1, limit: 1000 });
              if (resourceResponse.status === 'success' && resourceResponse.data) {
                const resource = resourceResponse.data.resources.find(r => r.id === comment.resource_id);
                if (resource) {
                  setSourceEntity(resource);
                }
              }
            }
          }
        } else {
          // 如果后端没有返回实体，尝试通过其他API获取
          if (item.entity_type === 'resource') {
            const response = await getResources({ page: 1, limit: 1000 });
            if (response.status === 'success' && response.data) {
              const resource = response.data.resources.find(r => r.id === item.entity_id);
              if (resource) {
                setEntityData(resource);
              }
            }
          } else if (item.entity_type === 'review') {
            const response = await getReview(item.entity_id);
            if (response.status === 'success' && response.data) {
              setEntityData(response.data);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load entity data:', err);
    } finally {
      setLoadingEntity(false);
    }
  };

  // 处理审核项
  const handleItemClick = async (item: ModerationQueueItem) => {
    setSelectedItem(item);
    setHandleStatus('approved');
    setHandleAction(undefined);
    setHandleNotes('');
    setEntityData(null);
    setShowHandleModal(true);
    await loadEntityData(item);
  };

  // 提交处理
  const handleSubmit = async () => {
    if (!selectedItem) return;

    setSubmitting(true);
    try {
      const params: HandleModerationItemParams = {
        status: handleStatus,
        action: handleAction,
        notes: handleNotes || undefined,
      };
      
      // 如果选择的是隐藏，确保status是approved
      if (handleAction === 'hide') {
        params.status = 'approved';
      }
      const response = await handleModerationItem(selectedItem.id, params);
      if (response.status === 'success') {
        showToast(t('admin.moderation.handleSuccess'), 'success');
        setShowHandleModal(false);
        
        // 如果是删除操作，从列表中移除该项目
        if (handleStatus === 'removed') {
          setQueueItems(prevItems => prevItems.filter(item => item.id !== selectedItem.id));
        } else {
          // 其他操作，重新加载队列
          loadQueue();
        }
        
        setSelectedItem(null);
      } else {
        showToast(response.message || t('admin.moderation.operationFailed'), 'error');
      }
    } catch (err: any) {
      console.error('Failed to handle item:', err);
      showToast(err.message || t('admin.moderation.operationFailed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 删除队列项中的所有举报记录
  const handleDeleteQueueReports = async (item: ModerationQueueItem) => {
    try {
      // 先获取该队列项的详细信息，包括所有举报记录
      const queueResponse = await getModerationQueueItem(item.id);
      if (queueResponse.status === 'success' && queueResponse.data?.reports) {
        const allReports = queueResponse.data.reports;
        let deletedCount = 0;
        let failedCount = 0;
        
        // 删除所有举报记录
        for (const report of allReports) {
          if (report.status === 'handled') {
            try {
              const response = await deleteReport(report.id);
              if (response.status === 'success') {
                deletedCount++;
              } else {
                failedCount++;
              }
            } catch (err) {
              failedCount++;
            }
          }
        }
        
        // 删除审核队列项
        const deleteQueueResponse = await deleteModerationQueueItem(item.id);
        if (deleteQueueResponse.status === 'success') {
          showToast(`成功删除审核队列项及 ${deletedCount} 条举报记录`, 'success');
          loadQueue();
        } else {
          showToast(deleteQueueResponse.message || '删除审核队列项失败', 'error');
        }
        
        if (failedCount > 0) {
          showToast(t('admin.moderation.deleteFailedWithCount', { count: failedCount }), 'error');
        }
      }
    } catch (err: any) {
      console.error('Failed to delete queue reports:', err);
      showToast(err.message || t('admin.moderation.deleteFailed'), 'error');
    }
  };

  // 格式化日期时间（使用i18n locale）
  const formatDate = (dateString?: string) => {
    return formatDateTime(dateString, i18n.language);
  };

  // 获取实体类型标签
  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case 'resource':
        return t('admin.moderation.entityType.resource');
      case 'review':
        return t('admin.moderation.entityType.review');
      case 'comment':
        return t('admin.moderation.entityType.comment');
      default:
        return type;
    }
  };

  // 获取状态标签
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return t('admin.moderation.status.pending');
      case 'pending_review':
        return t('admin.moderation.tabs.pendingReview');
      case 'handled':
        return t('admin.moderation.status.handled');
      case 'approved':
        return t('admin.moderation.status.approved');
      case 'rejected':
        return t('admin.moderation.status.rejected');
      case 'removed':
        return t('admin.moderation.status.removed');
      default:
        return status;
    }
  };


  return (
    <ProtectedRoute>
      <SideBar />
      <Avatar />
      <main className="app-main">
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.mainTitle}>{t('admin.moderation.title')}</h1>
            <p className={styles.subTitle}>{t('admin.moderation.subtitle')}</p>
          </div>


          {/* 筛选器 */}
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${queueStatusFilter === 'all' ? styles.active : ''}`}
              onClick={() => setQueueStatusFilter('all')}
            >
              {t('admin.moderation.filter.all')}
            </button>
            <button
              type="button"
              className={`${styles.tab} ${queueStatusFilter === 'pending' ? styles.active : ''}`}
              onClick={() => setQueueStatusFilter('pending')}
            >
              {t('admin.moderation.filter.pending')}
            </button>
            <button
              type="button"
              className={`${styles.tab} ${queueStatusFilter === 'pending_review' ? styles.active : ''}`}
              onClick={() => setQueueStatusFilter('pending_review')}
            >
              {t('admin.moderation.tabs.pendingReview')}
            </button>
            <button
              type="button"
              className={`${styles.tab} ${queueStatusFilter === 'approved' ? styles.active : ''}`}
              onClick={() => setQueueStatusFilter('approved')}
            >
              {t('admin.moderation.filter.approved')}
            </button>
            <button
              type="button"
              className={`${styles.tab} ${queueStatusFilter === 'rejected' ? styles.active : ''}`}
              onClick={() => setQueueStatusFilter('rejected')}
            >
              {t('admin.moderation.filter.rejected')}
            </button>
            <button
              type="button"
              className={`${styles.tab} ${queueStatusFilter === 'removed' ? styles.active : ''}`}
              onClick={() => setQueueStatusFilter('removed')}
            >
              {t('admin.moderation.filter.removed')}
            </button>
          </div>

          {/* 列表 */}
          {loading ? (
            <div className={styles.loadingState}>
              <p className={styles.loadingText}>{t('admin.moderation.loading')}</p>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <p className={styles.errorText}>{error}</p>
            </div>
          ) : queueItems.length === 0 ? (
            <div className={styles.tabPanel}>
              <div className={styles.emptyState}>
                <p className={styles.emptyStateText}>{t('admin.moderation.noQueueItems')}</p>
              </div>
            </div>
          ) : (
            <div className={styles.tabPanel}>
              <div className={styles.courseList}>
                {queueItems.map((item) => (
                  <div key={item.id} className={styles.courseCard}>
                    <div className={styles.courseCardContent}>
                      <div className={styles.courseName}>
                        {getEntityTypeLabel(item.entity_type)} #{item.entity_id}
                      </div>
                      <div className={styles.courseDept}>
                        <span style={{ marginRight: '16px' }}>
                          {t('admin.moderation.reportCount')}: {item.report_count}
                        </span>
                        {item.handler && (
                          <span style={{ marginRight: '16px' }}>
                            {t('admin.moderation.handler')}: {item.handler.nickname}
                          </span>
                        )}
                        {item.handled_at && (
                          <span style={{ marginRight: '16px' }}>
                            {t('admin.moderation.handledAt')}: {formatDate(item.handled_at)}
                          </span>
                        )}
                        {item.notes && (
                          <span>
                            {t('admin.moderation.notes')}: {item.notes}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={styles.courseCardActions}>
                      {(item.status === 'pending' || item.status === 'pending_review') && (
                        <Tooltip title={t('admin.moderation.handle')}>
                          <button
                            type="button"
                            className={styles.reviewButton}
                            onClick={() => handleItemClick(item)}
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
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                              <path d="M9 12l2 2 4-4" />
                            </svg>
                          </button>
                        </Tooltip>
                      )}
                      {(item.status === 'approved' || item.status === 'rejected' || item.status === 'removed') && (
                        <Tooltip title="删除举报记录">
                          <button
                            type="button"
                            className={styles.reviewButton}
                            onClick={() => handleDeleteQueueReports(item)}
                            style={{ color: 'var(--danger)' }}
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
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </Tooltip>
                      )}
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
                {t('admin.moderation.prevPage')}
              </button>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {t('admin.moderation.pageInfo', { page, totalPages })}
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
                {t('admin.moderation.nextPage')}
              </button>
            </div>
          )}

          {/* 处理模态框 */}
          {showHandleModal && selectedItem && (
            <div 
              className={modalStyles.overlay}
              onClick={() => setShowHandleModal(false)}
            >
              <div 
                className={modalStyles.modal}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={modalStyles.header}>
                  <h2 className={modalStyles.title}>
                    {t('admin.moderation.handleTitle')}
                  </h2>
                  <button
                    type="button"
                    className={modalStyles.closeButton}
                    onClick={() => setShowHandleModal(false)}
                  >
                    ×
                  </button>
                </div>
                <div className={modalStyles.content}>
                  {/* 显示被举报实体 */}
                  {loadingEntity ? (
                    <div className={modalStyles.loadingState}>
                      <p>{t('admin.moderation.loading')}</p>
                    </div>
                  ) : selectedItem && (selectedItem.entity_type === 'review_comment' || selectedItem.entity_type === 'resource_comment') && entityData ? (
                    <div className={modalStyles.section}>
                      <div className={modalStyles.reportedContent}>
                        {t('admin.moderation.reportedContent')}:
                      </div>
                      {/* 评论卡片 */}
                      <div style={{ 
                        padding: '16px', 
                        background: 'var(--card)', 
                        border: '1px solid var(--card-border)', 
                        borderRadius: '12px',
                        marginBottom: '12px'
                      }}>
                        <div style={{ 
                          fontSize: '14px', 
                          color: 'var(--text)', 
                          marginBottom: '8px',
                          lineHeight: '1.5'
                        }}>
                          {(entityData as ReviewComment | ResourceComment).content}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {(entityData as ReviewComment | ResourceComment).floor_number && (
                            <>
                              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                #{(entityData as ReviewComment | ResourceComment).floor_number}
                              </span>
                              <span>•</span>
                            </>
                          )}
                          <span>{(entityData as ReviewComment | ResourceComment).user?.nickname || t('allCourses.review.anonymous')}</span>
                          <span>•</span>
                          <span>
                            {formatDate((entityData as ReviewComment | ResourceComment).created_at)}
                          </span>
                        </div>
                      </div>
                      {/* 来源实体卡片 */}
                      {sourceEntity && (
                        <>
                          <div style={{ 
                            fontSize: '13px', 
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            marginBottom: '8px',
                            marginTop: '8px'
                          }}>
                            {selectedItem.entity_type === 'review_comment' 
                              ? t('admin.moderation.sourceReview') || '来源课评：'
                              : t('admin.moderation.sourceResource') || '来源资源：'
                            }
                          </div>
                        <div onClick={() => setShowEntityDetail(true)} style={{ cursor: 'pointer' }}>
                          {('course_id' in sourceEntity || 'rating_overall' in sourceEntity) ? (
                            <ReviewCard
                              review={sourceEntity as Review}
                              hideActions={true}
                              onViewDetail={() => setShowEntityDetail(true)}
                            />
                          ) : (
                            <ResourceCard
                              resource={sourceEntity as Resource}
                              hideActions={true}
                              onViewDetail={() => setShowEntityDetail(true)}
                            />
                          )}
                          </div>
                        </>
                      )}
                    </div>
                  ) : entityData && selectedItem ? (
                    <div className={modalStyles.section}>
                      <div className={modalStyles.reportedContent}>
                        {t('admin.moderation.reportedContent')}:
                      </div>
                      {selectedItem.entity_type === 'resource' && (
                        <div onClick={() => setShowEntityDetail(true)} style={{ cursor: 'pointer' }}>
                          <ResourceCard
                            resource={entityData as Resource}
                            hideActions={true}
                            onViewDetail={() => setShowEntityDetail(true)}
                          />
                        </div>
                      )}
                      {selectedItem.entity_type === 'review' && (
                        <div onClick={() => setShowEntityDetail(true)} style={{ cursor: 'pointer' }}>
                          <ReviewCard
                            review={entityData as Review}
                            hideActions={true}
                            onViewDetail={() => setShowEntityDetail(true)}
                          />
                        </div>
                      )}
                    </div>
                  ) : null}
                  
                  <div className={modalStyles.section}>
                    <label className={modalStyles.sectionTitle}>
                      {t('admin.moderation.form.status')} <span className={modalStyles.required}>*</span>
                    </label>
                    <div className={modalStyles.statusButtonGroup}>
                      <button
                        type="button"
                        className={`${modalStyles.statusButton} ${handleStatus === 'approved' && !handleAction ? modalStyles.approved : ''}`}
                        onClick={() => {
                          setHandleStatus('approved');
                          setHandleAction(undefined);
                        }}
                      >
                        {t('admin.moderation.action.noViolation')}
                      </button>
                      {selectedItem?.entity_type === 'resource' && (
                        <button
                          type="button"
                          className={`${modalStyles.statusButton} ${handleStatus === 'approved' && handleAction === 'hide' ? modalStyles.hide : ''}`}
                          onClick={() => {
                            setHandleStatus('approved');
                            setHandleAction('hide');
                          }}
                        >
                          {t('admin.moderation.action.hide')}
                        </button>
                      )}
                      <button
                        type="button"
                        className={`${modalStyles.statusButton} ${handleStatus === 'removed' ? modalStyles.removed : ''}`}
                        onClick={() => {
                          setHandleStatus('removed');
                          setHandleAction(undefined);
                        }}
                      >
                        {t('admin.moderation.action.delete')}
                      </button>
                    </div>
                  </div>
                  <div className={modalStyles.section}>
                    <label className={modalStyles.sectionTitle}>
                      {t('admin.moderation.form.notes')}
                    </label>
                    <textarea
                      className={modalStyles.textarea}
                      value={handleNotes}
                      onChange={(e) => setHandleNotes(e.target.value)}
                      placeholder={t('admin.moderation.form.notesPlaceholder')}
                      rows={5}
                    />
                  </div>
                </div>
                <div className={modalStyles.actionButtons}>
                  <button
                    type="button"
                    className={modalStyles.cancelButton}
                    onClick={() => setShowHandleModal(false)}
                  >
                    {t('admin.moderation.cancel')}
                  </button>
                  <button
                    type="button"
                    className={modalStyles.submitButton}
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting
                      ? t('admin.moderation.submitting')
                      : t('admin.moderation.submit')}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* 实体详情模态框 */}
          {selectedItem && (
            <>
              {/* 资源详情 */}
              {selectedItem.entity_type === 'resource' && entityData && (
                <ResourceDetailModal
                  open={showEntityDetail}
                  onClose={() => setShowEntityDetail(false)}
                  resource={entityData as Resource}
                  showReportButton={false}
                />
              )}
              {/* 课评详情 */}
              {selectedItem.entity_type === 'review' && entityData && (
                <ReviewDetailModal
                  open={showEntityDetail}
                  onClose={() => setShowEntityDetail(false)}
                  review={entityData as Review}
                  showReportButton={false}
                />
              )}
              {/* 评论来源实体详情 - 课评评论的来源课评 */}
              {selectedItem.entity_type === 'review_comment' && sourceEntity && (
                <ReviewDetailModal
                  open={showEntityDetail}
                  onClose={() => setShowEntityDetail(false)}
                  review={sourceEntity as Review}
                  showReportButton={false}
                />
              )}
              {/* 评论来源实体详情 - 资源评论的来源资源 */}
              {selectedItem.entity_type === 'resource_comment' && sourceEntity && (
                <ResourceDetailModal
                  open={showEntityDetail}
                  onClose={() => setShowEntityDetail(false)}
                  resource={sourceEntity as Resource}
                  showReportButton={false}
                />
              )}
            </>
          )}
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

