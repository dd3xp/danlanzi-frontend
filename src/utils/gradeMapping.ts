/**
 * 成绩映射工具函数
 * 将1-10分的评分映射到字母成绩
 */

export function mapRatingToGrade(rating: number): string {
  if (rating === 10) {
    return 'A+';
  } else if (rating >= 9.5 && rating < 10) {
    return 'A';
  } else if (rating >= 9.0 && rating < 9.5) {
    return 'A-';
  } else if (rating >= 8.5 && rating < 9.0) {
    return 'B+';
  } else if (rating >= 8.0 && rating < 8.5) {
    return 'B';
  } else if (rating >= 7.5 && rating < 8.0) {
    return 'B-';
  } else if (rating >= 7.0 && rating < 7.5) {
    return 'C+';
  } else if (rating >= 6.5 && rating < 7.0) {
    return 'C-';
  } else if (rating >= 6.0 && rating < 6.5) {
    return 'D';
  } else {
    return 'F';
  }
}

