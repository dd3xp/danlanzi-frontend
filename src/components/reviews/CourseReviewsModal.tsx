import React, { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { useTranslation } from 'next-i18next';
import { getReviews, Review } from '@/services/reviewService';
import ReviewDetailModal from './ReviewDetailModal';
import InstructorRatingList from './InstructorRatingList';
import ReviewList from './ReviewList';
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
  const [activeTab, setActiveTab] = useState<'reviews' | 'instructors'>('reviews');
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
    // 直接使用1-10分，不再需要映射转换
    return Math.round(average * 10) / 10; // 保留一位小数
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
        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'reviews'}
            className={`${styles.tab} ${activeTab === 'reviews' ? styles.active : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            {t('allCourses.review.reviews') || '课程评价'}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'instructors'}
            className={`${styles.tab} ${activeTab === 'instructors' ? styles.active : ''}`}
            onClick={() => setActiveTab('instructors')}
          >
            {t('allCourses.review.instructors') || '老师评价'}
          </button>
            </div>

        <div className={styles.tabPanel} role="tabpanel">
          {activeTab === 'reviews' && (
            <ReviewList
              reviews={reviews}
              loading={loading}
                onViewDetail={handleViewDetail}
                onUpdate={(updatedReview) => {
                  setReviews(reviews.map(r => r.id === updatedReview.id ? updatedReview : r));
                }}
              />
          )}

          {activeTab === 'instructors' && (
            <div className={styles.instructorsPanel}>
              {loading ? (
                <div className={styles.loadingState}>
                  <p>{t('allCourses.states.loading')}</p>
                </div>
              ) : (
                <InstructorRatingList
                  reviews={reviews}
                />
              )}
            </div>
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

