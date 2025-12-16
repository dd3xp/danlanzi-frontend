import React from 'react';
import { useTranslation } from 'next-i18next';
import { Review } from '@/services/reviewService';
import { mapRatingToGrade } from '@/utils/gradeMapping';
import styles from '@/styles/reviews/InstructorRatingList.module.css';

interface InstructorRating {
  instructor: string;
  averageRating: number;
  reviewCount: number;
  grade: string;
}

interface InstructorRatingListProps {
  reviews: Review[];
}

export default function InstructorRatingList({ reviews }: InstructorRatingListProps) {
  const { t } = useTranslation('common');

  // 计算每个老师的平均分（不区分学期）
  const calculateInstructorRatings = (): InstructorRating[] => {
    const instructorMap = new Map<string, number[]>();

    // 收集每个老师的所有评分
    reviews.forEach((review) => {
      if (!review.offering?.instructor) return;
      
      const instructors = Array.isArray(review.offering.instructor)
        ? review.offering.instructor
        : [review.offering.instructor];
      
      const rating = review.rating_overall || review.rating_teaching;
      if (rating === null || rating === undefined) return;

      instructors.forEach((instructor) => {
        if (!instructorMap.has(instructor)) {
          instructorMap.set(instructor, []);
        }
        instructorMap.get(instructor)!.push(rating);
      });
    });

    // 计算每个老师的平均分
    const instructorRatings: InstructorRating[] = [];
    instructorMap.forEach((ratings, instructor) => {
      const sum = ratings.reduce((acc, rating) => acc + rating, 0);
      const average = sum / ratings.length;
      const averageRounded = Math.round(average * 10) / 10;
      const grade = mapRatingToGrade(averageRounded);
      
      instructorRatings.push({
        instructor,
        averageRating: averageRounded,
        reviewCount: ratings.length,
        grade,
      });
    });

    // 按平均分降序排序
    instructorRatings.sort((a, b) => b.averageRating - a.averageRating);

    return instructorRatings;
  };

  const instructorRatings = calculateInstructorRatings();

  if (instructorRatings.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>{t('allCourses.review.noInstructors') || '暂无老师评价'}</p>
      </div>
    );
  }

  return (
    <div className={styles.instructorList}>
      {instructorRatings.map((item) => (
        <div
          key={item.instructor}
          className={styles.instructorItem}
        >
          <div className={styles.instructorInfo}>
            <span className={styles.instructorName}>{item.instructor}</span>
            <span className={styles.reviewCount}>
              {item.reviewCount} {t('allCourses.review.reviews') || '条评价'}
            </span>
          </div>
          <div className={styles.ratingInfo}>
            <span className={styles.averageRating}>
              ⭐ {item.averageRating.toFixed(1)}/10
            </span>
            <span className={`${styles.grade} ${item.grade === 'F' ? styles.gradeF : ''}`}>{item.grade}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

