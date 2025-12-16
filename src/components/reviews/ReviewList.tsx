import React from 'react';
import { useTranslation } from 'next-i18next';
import { Review } from '@/services/reviewService';
import ReviewCard from './ReviewCard';
import styles from '@/styles/reviews/ReviewList.module.css';

interface ReviewListProps {
  reviews: Review[];
  loading?: boolean;
  onViewDetail?: (review: Review) => void;
  onUpdate?: (updatedReview: Review) => void;
}

export default function ReviewList({ 
  reviews, 
  loading = false,
  onViewDetail,
  onUpdate 
}: ReviewListProps) {
  const { t } = useTranslation('common');

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <p>{t('allCourses.states.loading')}</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>{t('allCourses.review.noReviews')}</p>
      </div>
    );
  }

  return (
    <div className={styles.reviewList}>
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          onViewDetail={onViewDetail}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}

