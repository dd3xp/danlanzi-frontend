import React, { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { useTranslation } from 'next-i18next';
import { formatDateTime } from '@/utils/dateUtils';
import { Notification } from '@/services/notificationService';
import { Resource, getResources } from '@/services/resourceService';
import { Review, getReview } from '@/services/reviewService';
import { ReviewComment, getReviewComment } from '@/services/reviewCommentService';
import { ResourceComment, getResourceComment } from '@/services/resourceCommentService';
import ResourceCard from '@/components/resources/ResourceCard';
import ReviewCard from '@/components/reviews/ReviewCard';
import ResourceDetailModal from '@/components/resources/ResourceDetailModal';
import ReviewDetailModal from '@/components/reviews/ReviewDetailModal';
import styles from '@/styles/notifications/NotificationDetailModal.module.css';

interface NotificationDetailModalProps {
  open: boolean;
  onClose: () => void;
  notification: Notification | null;
}

export default function NotificationDetailModal({ open, onClose, notification }: NotificationDetailModalProps) {
  const { t, i18n } = useTranslation('common');
  const [loading, setLoading] = useState(false);
  const [entityData, setEntityData] = useState<Resource | Review | ReviewComment | ResourceComment | null>(null);
  const [sourceEntity, setSourceEntity] = useState<Resource | Review | null>(null);
  const [showEntityDetail, setShowEntityDetail] = useState(false);

  useEffect(() => {
    if (open && notification && notification.entity_type && notification.entity_id) {
      loadEntityData();
    } else {
      setEntityData(null);
      setSourceEntity(null);
    }
  }, [open, notification]);

  const loadEntityData = async () => {
    if (!notification || !notification.entity_type || !notification.entity_id) return;

    setLoading(true);
    try {
      let entity: any = null;
      
      // 根据 entity_type 调用不同的 API
      if (notification.entity_type === 'resource') {
        // 获取资源列表并过滤（由于没有单个资源API）
        const response = await getResources({ page: 1, limit: 1000 });
        if (response.status === 'success' && response.data) {
          entity = response.data.resources.find(r => r.id === notification.entity_id);
        }
      } else if (notification.entity_type === 'review') {
        const response = await getReview(notification.entity_id);
        if (response.status === 'success' && response.data) {
          entity = response.data.review;
        }
      } else if (notification.entity_type === 'review_comment') {
        const response = await getReviewComment(notification.entity_id);
        if (response.status === 'success' && response.data) {
          entity = response.data.comment;
          // 加载来源课评
          if (entity.review_id) {
            const reviewResponse = await getReview(entity.review_id);
            if (reviewResponse.status === 'success' && reviewResponse.data) {
              setSourceEntity(reviewResponse.data.review);
            }
          } else if (entity.review) {
            // 如果后端已经返回了关联的review
            setSourceEntity(entity.review);
          }
        }
      } else if (notification.entity_type === 'resource_comment') {
        const response = await getResourceComment(notification.entity_id);
        if (response.status === 'success' && response.data) {
          entity = response.data.comment;
          // 加载来源资源
          if (entity.resource_id) {
            const resourceResponse = await getResources({ page: 1, limit: 1000 });
            if (resourceResponse.status === 'success' && resourceResponse.data) {
              const resource = resourceResponse.data.resources.find(r => r.id === entity.resource_id);
              if (resource) {
                setSourceEntity(resource);
              }
            }
          } else if (entity.resource) {
            // 如果后端已经返回了关联的resource
            setSourceEntity(entity.resource);
          }
        }
      }

      setEntityData(entity);
    } catch (error) {
      console.error('Failed to load entity data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!notification) return null;

  const isAnnouncement = notification.type === 'announcement';
  const isComment = notification.entity_type === 'review_comment' || notification.entity_type === 'resource_comment';

  return (
    <>
      <Modal
        title={notification.title || t('notifications.detail')}
        open={open}
        onCancel={onClose}
        footer={null}
        width={700}
        className={styles.modal}
      >
        <div className={styles.container}>
          {/* 消息正文 */}
          {notification.content && (
            <div className={styles.content}>
              {notification.content}
            </div>
          )}

          {/* 关联实体（仅非公告类型） */}
          {!isAnnouncement && notification.entity_type && notification.entity_id && (
            <>
              {loading ? (
                <div className={styles.loadingState}>
                  <p>{t('notifications.loading')}</p>
                </div>
              ) : isComment && entityData ? (
                // 评论类型：显示评论卡片和来源实体
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>
                    {t('notifications.commentContent')}:
                  </div>
                  <div className={styles.commentCard}>
                    <div className={styles.commentText}>
                      {(entityData as ReviewComment | ResourceComment).content}
                    </div>
                    <div className={styles.commentMeta}>
                      {(entityData as ReviewComment | ResourceComment).floor_number && (
                        <>
                          <span className={styles.floorNumber}>
                            #{(entityData as ReviewComment | ResourceComment).floor_number}
                          </span>
                          <span>•</span>
                        </>
                      )}
                      <span>{(entityData as ReviewComment | ResourceComment).user?.nickname || t('allCourses.review.anonymous')}</span>
                      <span>•</span>
                      <span>
                        {formatDateTime((entityData as ReviewComment | ResourceComment).created_at, i18n.language)}
                      </span>
                    </div>
                  </div>
                  {/* 来源实体 */}
                  {sourceEntity && (
                    <>
                      <div className={styles.sectionTitle}>
                        {notification.entity_type === 'review_comment'
                          ? t('notifications.sourceReview')
                          : t('notifications.sourceResource')
                        }
                      </div>
                      <div onClick={() => setShowEntityDetail(true)} className={styles.clickableEntity}>
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
              ) : entityData ? (
                // 资源或课评类型：直接显示卡片
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>
                    {t('notifications.relatedEntity')}
                  </div>
                  <div onClick={() => setShowEntityDetail(true)} className={styles.clickableEntity}>
                    {notification.entity_type === 'resource' ? (
                      <ResourceCard
                        resource={entityData as Resource}
                        hideActions={true}
                        onViewDetail={() => setShowEntityDetail(true)}
                      />
                    ) : (
                      <ReviewCard
                        review={entityData as Review}
                        hideActions={true}
                        onViewDetail={() => setShowEntityDetail(true)}
                      />
                    )}
                  </div>
                </div>
              ) : null}
            </>
          )}

          {/* 时间 */}
          <div className={styles.time}>
            {formatDateTime(notification.created_at, i18n.language)}
          </div>
        </div>
      </Modal>

      {/* 实体详情模态框 */}
      {entityData && notification.entity_type === 'resource' && (
        <ResourceDetailModal
          open={showEntityDetail}
          onClose={() => setShowEntityDetail(false)}
          resource={entityData as Resource}
        />
      )}
      {entityData && notification.entity_type === 'review' && (
        <ReviewDetailModal
          open={showEntityDetail}
          onClose={() => setShowEntityDetail(false)}
          review={entityData as Review}
        />
      )}
      {sourceEntity && (
        <>
          {('course_id' in sourceEntity || 'rating_overall' in sourceEntity) ? (
            <ReviewDetailModal
              open={showEntityDetail}
              onClose={() => setShowEntityDetail(false)}
              review={sourceEntity as Review}
            />
          ) : (
            <ResourceDetailModal
              open={showEntityDetail}
              onClose={() => setShowEntityDetail(false)}
              resource={sourceEntity as Resource}
            />
          )}
        </>
      )}
    </>
  );
}
