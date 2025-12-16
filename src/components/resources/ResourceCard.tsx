import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import Tooltip from '@/components/global/Tooltip';
import { Resource } from '@/services/resourceService';
import { parseResourceTags, formatCount } from '@/utils/resourceUtils';
import ReportModal from '@/components/report/ReportModal';
import styles from '@/styles/resources/ResourceCard.module.css';

interface ResourceCardProps {
  resource: Resource;
  isFavorited?: boolean;
  isLiked?: boolean;
  showDelete?: boolean;
  showEdit?: boolean;
  hideActions?: boolean; // 隐藏所有操作按钮
  onFavorite?: (resourceId: number) => void;
  onLike?: (resourceId: number) => void;
  onDelete?: (resource: Resource) => void;
  onEdit?: (resource: Resource) => void;
  onViewDetail?: (resource: Resource) => void;
}

export default function ResourceCard({
  resource,
  isFavorited = false,
  isLiked = false,
  showDelete = false,
  showEdit = false,
  hideActions = false,
  onFavorite,
  onLike,
  onDelete,
  onEdit,
  onViewDetail
}: ResourceCardProps) {
  const { t } = useTranslation('common');
  const { term, courseName, courseCode, instructors, others } = parseResourceTags(resource);
  const favoriteCount = resource.stats?.favorite_count || 0;
  const likeCount = resource.stats?.like_count || 0;
  const [showReportModal, setShowReportModal] = useState(false);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFavorite) {
      onFavorite(resource.id);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLike) {
      onLike(resource.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(resource);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) {
      onEdit(resource);
    }
  };

  const handleViewDetail = () => {
    if (onViewDetail) {
      onViewDetail(resource);
    }
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowReportModal(true);
  };

  return (
    <>
      <div className={styles.resourceCard}>
      <div className={styles.resourceCardContent}>
        <div className={`${styles.resourceTitle} ${resource.status === 'hidden' ? styles.hidden : ''}`}>
          {resource.title}
        </div>
        <div className={styles.tagsContainer}>
          {term.map((t, idx) => (
            <span key={`term-${idx}`} className={`${styles.tag} ${styles.tagTerm}`}>
              {t}
            </span>
          ))}
          {courseName.map((name, idx) => (
            <span key={`name-${idx}`} className={`${styles.tag} ${styles.tagCourseName}`}>
              {name}
            </span>
          ))}
          {courseCode.map((code, idx) => (
            <span key={`code-${idx}`} className={`${styles.tag} ${styles.tagCourseCode}`}>
              {code}
            </span>
          ))}
          {instructors.map((inst, idx) => (
            <span key={`inst-${idx}`} className={`${styles.tag} ${styles.tagInstructor}`}>
              {inst}
            </span>
          ))}
          {others.map((other, idx) => (
            <span key={`other-${idx}`} className={`${styles.tag} ${styles.tagOther}`}>
              {other}
            </span>
          ))}
        </div>
      </div>
      {!hideActions && (
        <div className={styles.cardActions}>
          <div className={styles.actionButtonGroup}>
            {onFavorite && (
            <Tooltip title={isFavorited ? t('allCourses.resource.unfavorite') : t('allCourses.resource.favorite')}>
              <button
                type="button"
                className={styles.favoriteButton}
                onClick={handleFavorite}
              >
                <svg
                  className={`${styles.starIcon} ${isFavorited ? styles.starFilled : ''}`}
                  viewBox="0 0 24 24"
                  fill={isFavorited ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span className={styles.actionCount}>{formatCount(favoriteCount)}</span>
              </button>
            </Tooltip>
          )}
          {onLike && (
            <Tooltip title={isLiked ? t('allCourses.resource.unlike') : t('allCourses.resource.like')}>
              <button
                type="button"
                className={styles.likeButton}
                onClick={handleLike}
              >
                <svg
                  className={`${styles.likeIcon} ${isLiked ? styles.likeFilled : ''}`}
                  viewBox="0 0 24 24"
                  fill={isLiked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
                </svg>
                <span className={styles.actionCount}>{formatCount(likeCount)}</span>
              </button>
            </Tooltip>
          )}
        </div>
        {showEdit && onEdit && (
          <Tooltip title={t('myResources.edit')}>
            <button
              type="button"
              className={styles.editButton}
              onClick={handleEdit}
            >
              <svg
                className={styles.editIcon}
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
        )}
        {showDelete && onDelete && (
          <Tooltip title={t('myResources.delete')}>
            <button
              type="button"
              className={styles.deleteButton}
              onClick={handleDelete}
            >
              <svg
                className={styles.deleteIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          </Tooltip>
        )}
        <Tooltip title={t('report.title')}>
          <button
            type="button"
            className={styles.reportButton}
            onClick={handleReport}
          >
            <svg
              className={styles.reportIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
          </button>
        </Tooltip>
        {onViewDetail && (
          <Tooltip title={t('allCourses.resource.viewDetail')}>
            <button
              type="button"
              className={styles.viewButton}
              onClick={handleViewDetail}
            >
              <svg
                className={styles.arrowIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </Tooltip>
        )}
      </div>
      )}
      {!hideActions && (
        <ReportModal
          open={showReportModal}
          onClose={() => setShowReportModal(false)}
          entityType="resource"
          entityId={resource.id}
        />
      )}
    </div>
    </>
  );
}

