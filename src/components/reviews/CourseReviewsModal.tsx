import React, { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { useTranslation } from 'next-i18next';
import { getReviews, Review } from '@/services/reviewService';
import ReviewDetailModal from './ReviewDetailModal';
import ReviewCard from './ReviewCard';
import AddReviewModal from './AddReviewModal';
import Tooltip from '@/components/global/Tooltip';
import styles from '@/styles/reviews/CourseReviewsModal.module.css';

interface CourseReviewsModalProps {
  open: boolean;
  onClose: () => void;
  courseId: number;
  courseName: string;
  courseDept?: string;
}

export default function CourseReviewsModal({ 
  open, 
  onClose, 
  courseId, 
  courseName,
  courseDept 
}: CourseReviewsModalProps) {
  const { t } = useTranslation('common');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [addReviewModalOpen, setAddReviewModalOpen] = useState(false);

  useEffect(() => {
    if (open && courseId) {
      loadReviews();
    } else {
      setReviews([]);
    }
  }, [open, courseId]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const response = await getReviews({
        course_id: courseId,
        limit: 100,
      });
      if (response.status === 'success' && response.data) {
        setReviews(response.data.reviews);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (review: Review) => {
    setSelectedReview(review);
    setDetailModalOpen(true);
  };

  const handleAddReviewSuccess = () => {
    loadReviews();
  };

  // 计算平均分
  const calculateAverageRating = () => {
    if (reviews.length === 0) return null;
    
    const validRatings = reviews
      .map(review => review.rating_overall || review.rating_teaching)
      .filter((rating): rating is number => rating !== null && rating !== undefined);
    
    if (validRatings.length === 0) return null;
    
    const sum = validRatings.reduce((acc, rating) => acc + rating, 0);
    const average = sum / validRatings.length;
    // 将1-5分映射到1-10分显示
    return Math.round((average / 5) * 10 * 10) / 10; // 保留一位小数
  };

  const averageRating = calculateAverageRating();

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        title={
          <div className={styles.titleContainer}>
            <div className={styles.titleLeft}>
              <span>{courseName}</span>
              {averageRating !== null && (
                <span className={styles.averageRating}>
                  ⭐ {averageRating.toFixed(1)}/10
                </span>
              )}
            </div>
            <Tooltip title={t('allCourses.review.addReview')}>
              <button
                type="button"
                className={styles.addButton}
                onClick={() => setAddReviewModalOpen(true)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </Tooltip>
          </div>
        }
        width={800}
        className={styles.modal}
      >
        <div className={styles.reviewsList}>
          {loading ? (
            <div className={styles.loadingState}>
              <p>{t('allCourses.states.loading')}</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className={styles.emptyState}>
              <p>{t('allCourses.review.noReviews')}</p>
            </div>
          ) : (
            reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onViewDetail={handleViewDetail}
                onUpdate={(updatedReview) => {
                  setReviews(reviews.map(r => r.id === updatedReview.id ? updatedReview : r));
                }}
              />
            ))
          )}
        </div>
      </Modal>
      {selectedReview && (
        <ReviewDetailModal
          open={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedReview(null);
          }}
          review={selectedReview}
          courseName={courseName}
        />
      )}
      <AddReviewModal
        open={addReviewModalOpen}
        onClose={() => setAddReviewModalOpen(false)}
        onSuccess={handleAddReviewSuccess}
        courseId={courseId}
        courseName={courseName}
        courseDept={courseDept}
      />
    </>
  );
}

