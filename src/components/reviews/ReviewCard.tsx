import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import Tooltip from '@/components/global/Tooltip';
import { Review, reactToReview } from '@/services/reviewService';
import { formatCount } from '@/utils/resourceUtils';
import styles from '@/styles/reviews/ReviewCard.module.css';

interface ReviewCardProps {
  review: Review;
  onViewDetail?: (review: Review) => void;
  onUpdate?: (updatedReview: Review) => void;
}

export default function ReviewCard({
  review,
  onViewDetail,
  onUpdate
}: ReviewCardProps) {
  const { t } = useTranslation('common');
  const [isLiked, setIsLiked] = useState(review.userReaction === 'like');
  const [isDisliked, setIsDisliked] = useState(review.userReaction === 'dislike');
  const [likeCount, setLikeCount] = useState(review.stats?.like_count || 0);
  const [dislikeCount, setDislikeCount] = useState(review.stats?.dislike_count || 0);
  
  // 显示评分（如果有），将1-5分映射到1-10分显示
  const rawRating = review.rating_overall || review.rating_teaching;
  const displayRating = rawRating ? Math.ceil((rawRating / 5) * 10) : null;
  
  // 显示老师信息
  const instructors = review.offering?.instructor 
    ? (Array.isArray(review.offering.instructor) 
        ? review.offering.instructor 
        : [review.offering.instructor])
    : [];

  const handleViewDetail = () => {
    if (onViewDetail) {
      onViewDetail(review);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await reactToReview(review.id, 'like');
      if (response.status === 'success' && response.data) {
        const newReaction = response.data.reaction;
        setIsLiked(newReaction === 'like');
        setIsDisliked(false);
        if (response.data.stats) {
          setLikeCount(response.data.stats.like_count || 0);
          setDislikeCount(response.data.stats.dislike_count || 0);
        }
        // 更新父组件的review
        if (onUpdate) {
          onUpdate({
            ...review,
            userReaction: newReaction,
            stats: response.data.stats
          });
        }
      }
    } catch (error) {
      console.error('Failed to like review:', error);
    }
  };

  const handleDislike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await reactToReview(review.id, 'dislike');
      if (response.status === 'success' && response.data) {
        const newReaction = response.data.reaction;
        setIsDisliked(newReaction === 'dislike');
        setIsLiked(false);
        if (response.data.stats) {
          setLikeCount(response.data.stats.like_count || 0);
          setDislikeCount(response.data.stats.dislike_count || 0);
        }
        // 更新父组件的review
        if (onUpdate) {
          onUpdate({
            ...review,
            userReaction: newReaction,
            stats: response.data.stats
          });
        }
      }
    } catch (error) {
      console.error('Failed to dislike review:', error);
    }
  };

  return (
    <div className={styles.reviewCard}>
      <div className={styles.reviewCardContent}>
        {review.title && (
          <div className={styles.reviewTitle}>{review.title}</div>
        )}
        {review.content && (
          <div className={styles.reviewContent}>
            {review.content.length > 100 
              ? `${review.content.substring(0, 100)}...` 
              : review.content}
          </div>
        )}
        <div className={styles.tagsContainer}>
          {displayRating && (
            <span className={`${styles.tag} ${styles.tagRating}`}>
              ⭐ {displayRating}/10
            </span>
          )}
          {review.offering?.term && (
            <span className={`${styles.tag} ${styles.tagTerm}`}>
              {review.offering.term}
            </span>
          )}
          {instructors.map((instructor, idx) => (
            <span key={`inst-${idx}`} className={`${styles.tag} ${styles.tagInstructor}`}>
              {instructor}
            </span>
          ))}
        </div>
      </div>
      <div className={styles.cardActions}>
        <div className={styles.actionButtonGroup}>
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
          <Tooltip title={isDisliked ? t('allCourses.review.undislike') : t('allCourses.review.dislike')}>
            <button
              type="button"
              className={styles.dislikeButton}
              onClick={handleDislike}
            >
              <svg
                className={`${styles.dislikeIcon} ${isDisliked ? styles.dislikeFilled : ''}`}
                viewBox="0 0 24 24"
                fill={isDisliked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 2.5C8 2.22 8.22 2 8.5 2h7c0.28 0 0.5 0.22 0.5 0.5V13h4l-8 9l-8-9h4V2.5z" />
              </svg>
              <span className={styles.actionCount}>{formatCount(dislikeCount)}</span>
            </button>
          </Tooltip>
        </div>
        {onViewDetail && (
          <Tooltip title={t('allCourses.review.viewDetail')}>
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
    </div>
  );
}

