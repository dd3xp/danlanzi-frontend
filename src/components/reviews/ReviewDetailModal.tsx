import React, { useEffect, useState } from 'react';
import { Modal, message } from 'antd';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { Review } from '@/services/reviewService';
import { getUserAvatar } from '@/services/userAvatarService';
import { formatCount } from '@/utils/resourceUtils';
import { 
  getReviewComments, 
  createReviewComment, 
  reactToComment,
  ReviewComment 
} from '@/services/reviewCommentService';
import Tooltip from '@/components/global/Tooltip';
import styles from '@/styles/reviews/ReviewDetailModal.module.css';

interface ReviewDetailModalProps {
  open: boolean;
  onClose: () => void;
  review: Review | null;
  courseName?: string;
}

export default function ReviewDetailModal({ open, onClose, review, courseName }: ReviewDetailModalProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [authorAvatar, setAuthorAvatar] = useState<string | null>(null);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    if (open && review?.author?.id && !review.is_anonymous) {
      loadAuthorAvatar();
    } else {
      setAuthorAvatar(null);
    }
    if (open && review?.id) {
      loadComments();
    } else {
      setComments([]);
      setShowReplyInput(false);
      setReplyContent('');
    }
  }, [open, review?.id, review?.author?.id, review?.is_anonymous]);

  const loadAuthorAvatar = async () => {
    if (!review?.author?.id) return;
    
    try {
      const response = await getUserAvatar(review.author.id);
      if (response.status === 'success' && response.avatar_data_url) {
        setAuthorAvatar(response.avatar_data_url);
      }
    } catch (error) {
      console.error('Failed to load author avatar:', error);
    }
  };

  const handleAuthorClick = () => {
    if (review?.author?.id && !review.is_anonymous) {
      router.push(`/user/profile?id=${review.author.id}`);
    }
  };

  const loadComments = async () => {
    if (!review?.id) return;
    setLoadingComments(true);
    try {
      const response = await getReviewComments({
        review_id: review.id,
        limit: 100,
      });
      if (response.status === 'success' && response.data) {
        setComments(response.data.comments);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleReplyClick = () => {
    setShowReplyInput(!showReplyInput);
  };

  const handleSubmitReply = async () => {
    if (!review?.id || !replyContent.trim()) {
      message.error(t('allCourses.review.commentRequired'));
      return;
    }

    setSubmittingReply(true);
    try {
      const response = await createReviewComment({
        review_id: review.id,
        content: replyContent.trim(),
      });

      if (response.status === 'success') {
        message.success(t('allCourses.review.commentSuccess'));
        setReplyContent('');
        setShowReplyInput(false);
        // 重新加载评论列表以获取最新数据
        await loadComments();
      } else {
        message.error(response.message || t('allCourses.review.commentFailed'));
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
      message.error(t('allCourses.review.commentFailed'));
    } finally {
      setSubmittingReply(false);
    }
  };

  if (!review) {
    return null;
  }

  const displayCourseName = review.course?.name || review.offering?.course?.name || courseName;
  const courseDept = review.course?.dept || review.offering?.course?.dept;
  
  const instructors = review.offering?.instructor 
    ? (Array.isArray(review.offering.instructor) 
        ? review.offering.instructor 
        : [review.offering.instructor])
    : [];

  const author = review.is_anonymous ? null : review.author;
  const displayChar = author?.nickname?.trim()?.charAt(0)?.toUpperCase() || '';

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={
        <div className={styles.titleContainer}>
          <span className={styles.titleText}>{review.title || t('allCourses.review.noTitle')}</span>
          {author && (
            <div className={styles.authorInfo} onClick={handleAuthorClick}>
              {authorAvatar ? (
                <div className={styles.authorAvatar}>
                  <Image
                    src={authorAvatar}
                    alt={author.nickname}
                    fill
                    className={styles.avatarImage}
                  />
                </div>
              ) : (
                <div className={styles.authorAvatarFallback}>
                  {displayChar}
                </div>
              )}
              <span className={styles.authorName}>{author.nickname}</span>
            </div>
          )}
          <div className={styles.titleActions}>
            <Tooltip title={t('allCourses.review.reply')}>
              <button
                type="button"
                className={styles.replyButton}
                onClick={handleReplyClick}
                aria-label={t('allCourses.review.reply')}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            </Tooltip>
          </div>
        </div>
      }
      width={700}
      className={styles.modal}
    >
      <div className={styles.content}>
        {/* 课程信息 */}
        <div className={styles.section}>
          {displayCourseName && (
            <div className={styles.infoRow}>
              <span className={styles.label}>{t('allCourses.resource.courseName')}:</span>
              <span className={styles.value}>{displayCourseName}</span>
            </div>
          )}
          {courseDept && (
            <div className={styles.infoRow}>
              <span className={styles.label}>{t('allCourses.resource.department')}:</span>
              <span className={styles.value}>{courseDept}</span>
            </div>
          )}
          {courseDept && <div className={styles.divider}></div>}
        </div>

        {/* 评分信息 */}
        {(review.rating_overall || review.rating_teaching) && (
          <div className={styles.section}>
            <div className={styles.ratingContainer}>
              <div className={styles.ratingItem}>
                <span className={styles.ratingLabel}>{t('allCourses.review.rating')}:</span>
                <div className={styles.stars}>
                  {/* 后端使用1-5分，映射到1-10分显示 */}
                  {Array.from({ length: 10 }, (_, i) => {
                    // 将1-5分映射到1-10分：1->2, 2->4, 3->6, 4->8, 5->10
                    const rawRating = review.rating_overall || review.rating_teaching || 0;
                    const mappedRating = Math.ceil((rawRating / 5) * 10);
                    return (
                      <span
                        key={i}
                        className={`${styles.star} ${i < mappedRating ? styles.starFilled : ''}`}
                      >
                        ⭐
                      </span>
                    );
                  })}
                  <span className={styles.ratingValue}>
                    {Math.ceil(((review.rating_overall || review.rating_teaching || 0) / 5) * 10)}/10
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 课评内容 */}
        {review.content && (
          <div className={styles.section}>
            <div className={styles.description}>{review.content}</div>
          </div>
        )}

        {/* 开课时间和老师信息 */}
        <div className={styles.section}>
          <div className={styles.tagsContainer}>
            {review.offering?.term && (
              <span className={`${styles.tag} ${styles.tagTerm}`}>{review.offering.term}</span>
            )}
            {instructors.map((instructor, index) => (
              <span key={index} className={`${styles.tag} ${styles.tagInstructor}`}>
                {instructor}
              </span>
            ))}
          </div>
        </div>

        {/* 回复输入框 */}
        {showReplyInput && (
          <div className={styles.section}>
            <div className={styles.replyInputContainer}>
              <div className={styles.replyInputWrapper}>
                <textarea
                  className={styles.replyInput}
                  placeholder={t('allCourses.review.replyPlaceholder')}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={3}
                />
              </div>
              <div className={styles.replyActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowReplyInput(false);
                    setReplyContent('');
                  }}
                >
                  {t('allCourses.review.cancel')}
                </button>
                <button
                  type="button"
                  className={styles.submitButton}
                  onClick={handleSubmitReply}
                  disabled={submittingReply || !replyContent.trim()}
                >
                  {submittingReply ? t('allCourses.states.submitting') : t('allCourses.review.submit')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 回复列表 */}
        <div className={styles.section}>
          <div className={styles.commentsHeader}>
            <span className={styles.commentsTitle}>
              {t('allCourses.review.comments')} ({comments.length})
            </span>
          </div>
          {loadingComments ? (
            <div className={styles.loadingState}>
              {t('allCourses.states.loading')}
            </div>
          ) : comments.length === 0 ? (
            <div className={styles.emptyComments}>
              {t('allCourses.review.noComments')}
            </div>
          ) : (
            <div className={styles.commentsList}>
              {comments.map((comment) => (
                <CommentItem 
                  key={comment.id} 
                  comment={comment}
                  onUpdate={(updatedComment) => {
                    setComments(comments.map(c => c.id === updatedComment.id ? updatedComment : c));
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// 评论项组件
interface CommentItemProps {
  comment: ReviewComment;
  onUpdate?: (updatedComment: ReviewComment) => void;
}

function CommentItem({ comment, onUpdate }: CommentItemProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(comment.userReaction === 'like');
  const [isDisliked, setIsDisliked] = useState(comment.userReaction === 'dislike');
  const [likeCount, setLikeCount] = useState(comment.stats?.like_count || 0);
  const [dislikeCount, setDislikeCount] = useState(comment.stats?.dislike_count || 0);

  useEffect(() => {
    if (comment.user?.id) {
      loadUserAvatar();
    }
  }, [comment.user?.id]);

  const loadUserAvatar = async () => {
    if (!comment.user?.id) return;
    try {
      const response = await getUserAvatar(comment.user.id);
      if (response.status === 'success' && response.avatar_data_url) {
        setUserAvatar(response.avatar_data_url);
      }
    } catch (error) {
      console.error('Failed to load user avatar:', error);
    }
  };

  const handleUserClick = () => {
    if (comment.user?.id) {
      router.push(`/user/profile?id=${comment.user.id}`);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await reactToComment(comment.id, 'like');
      if (response.status === 'success' && response.data) {
        const newReaction = response.data.reaction;
        setIsLiked(newReaction === 'like');
        setIsDisliked(false);
        if (response.data.stats) {
          setLikeCount(response.data.stats.like_count || 0);
          setDislikeCount(response.data.stats.dislike_count || 0);
        }
        // 更新父组件的comment
        if (onUpdate) {
          onUpdate({
            ...comment,
            userReaction: newReaction,
            stats: response.data.stats
          });
        }
      }
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handleDislike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await reactToComment(comment.id, 'dislike');
      if (response.status === 'success' && response.data) {
        const newReaction = response.data.reaction;
        setIsDisliked(newReaction === 'dislike');
        setIsLiked(false);
        if (response.data.stats) {
          setLikeCount(response.data.stats.like_count || 0);
          setDislikeCount(response.data.stats.dislike_count || 0);
        }
        // 更新父组件的comment
        if (onUpdate) {
          onUpdate({
            ...comment,
            userReaction: newReaction,
            stats: response.data.stats
          });
        }
      }
    } catch (error) {
      console.error('Failed to dislike comment:', error);
    }
  };

  const displayChar = comment.user?.nickname?.trim()?.charAt(0)?.toUpperCase() || '';

  return (
    <div className={styles.commentItem}>
      <div className={styles.commentHeader}>
        <div className={styles.commentUserInfo} onClick={handleUserClick}>
          {userAvatar ? (
            <div className={styles.commentAvatar}>
              <Image
                src={userAvatar}
                alt={comment.user?.nickname || ''}
                fill
                className={styles.avatarImage}
              />
            </div>
          ) : (
            <div className={styles.commentAvatarFallback}>
              {displayChar}
            </div>
          )}
          <span className={styles.commentUserName}>{comment.user?.nickname || t('allCourses.review.anonymous')}</span>
        </div>
        <span className={styles.commentTime}>
          {new Date(comment.created_at).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
      <div className={styles.commentContent}>{comment.content}</div>
      <div className={styles.commentActions}>
        <div className={styles.commentActionButtonGroup}>
          <Tooltip title={isLiked ? t('allCourses.resource.unlike') : t('allCourses.resource.like')}>
            <button
              type="button"
              className={styles.commentLikeButton}
              onClick={handleLike}
            >
              <svg
                className={`${styles.commentLikeIcon} ${isLiked ? styles.commentLikeFilled : ''}`}
                viewBox="0 0 24 24"
                fill={isLiked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
              </svg>
              <span className={styles.commentActionCount}>{formatCount(likeCount)}</span>
            </button>
          </Tooltip>
          <Tooltip title={isDisliked ? t('allCourses.review.undislike') : t('allCourses.review.dislike')}>
            <button
              type="button"
              className={styles.commentDislikeButton}
              onClick={handleDislike}
            >
              <svg
                className={`${styles.commentDislikeIcon} ${isDisliked ? styles.commentDislikeFilled : ''}`}
                viewBox="0 0 24 24"
                fill={isDisliked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 2.5C8 2.22 8.22 2 8.5 2h7c0.28 0 0.5 0.22 0.5 0.5V13h4l-8 9l-8-9h4V2.5z" />
              </svg>
              <span className={styles.commentActionCount}>{formatCount(dislikeCount)}</span>
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

