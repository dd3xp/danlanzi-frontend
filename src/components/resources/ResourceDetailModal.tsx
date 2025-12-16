import React, { useEffect, useState } from 'react';
import { Modal, message } from 'antd';
import { useTranslation } from 'next-i18next';
import { formatDateTime } from '@/utils/dateUtils';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { Resource } from '@/services/resourceService';
import { getAuthHeaders } from '@/utils/auth';
import backendUrl from '@/services/backendUrl';
import { getUserAvatar } from '@/services/userAvatarService';
import { formatCount } from '@/utils/resourceUtils';
import { 
  getResourceComments, 
  createResourceComment, 
  reactToResourceComment,
  ResourceComment 
} from '@/services/resourceCommentService';
import Tooltip from '@/components/global/Tooltip';
import ReportModal from '@/components/report/ReportModal';
import { TAG_PREFIXES } from '@/utils/resourceUtils';
import styles from '@/styles/resources/ResourceDetailModal.module.css';

interface ResourceDetailModalProps {
  open: boolean;
  onClose: () => void;
  resource: Resource | null;
  courseName?: string;
  showReportButton?: boolean; // 是否显示举报按钮，默认true
}

export default function ResourceDetailModal({ open, onClose, resource, courseName, showReportButton = true }: ResourceDetailModalProps) {
  const { i18n } = useTranslation('common');
  const { t } = useTranslation('common');
  const router = useRouter();
  const [uploaderAvatar, setUploaderAvatar] = useState<string | null>(null);
  const [comments, setComments] = useState<ResourceComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    if (open && resource?.uploader?.id) {
      loadUploaderAvatar();
    } else {
      setUploaderAvatar(null);
    }
    if (open && resource?.id) {
      loadComments();
    } else {
      setComments([]);
      setShowReplyInput(false);
      setReplyContent('');
    }
  }, [open, resource?.id, resource?.uploader?.id]);

  const loadUploaderAvatar = async () => {
    if (!resource?.uploader?.id) return;
    
    try {
      const response = await getUserAvatar(resource.uploader.id);
      if (response.status === 'success' && response.avatar_data_url) {
        setUploaderAvatar(response.avatar_data_url);
      }
    } catch (error) {
      console.error('Failed to load uploader avatar:', error);
    }
  };

  const handleUploaderClick = () => {
    if (resource?.uploader?.id) {
      router.push(`/user/profile?id=${resource.uploader.id}`);
    }
  };

  const loadComments = async () => {
    if (!resource?.id) return;
    setLoadingComments(true);
    try {
      const response = await getResourceComments({
        resource_id: resource.id,
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
    if (!resource?.id || !replyContent.trim()) {
      message.error(t('allCourses.review.commentRequired'));
      return;
    }

    setSubmittingReply(true);
    try {
      const response = await createResourceComment({
        resource_id: resource.id,
        content: replyContent.trim(),
      });

      if (response.status === 'success') {
        message.success(t('allCourses.review.commentSuccess'));
        setReplyContent('');
        setShowReplyInput(false);
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

  if (!resource) {
    return null;
  }

  // 解析tags，提取不同类型
  const parseTags = () => {
    const tags = resource.tags || [];
    
    // 从offering中获取学期信息
    let term: string | undefined;
    let instructors: string[] = [];
    let courseDept: string | undefined;
    let courseNameFromApi: string | undefined;
    
    if (resource.courseLinks && resource.courseLinks.length > 0) {
      const link = resource.courseLinks[0];
      if (link.offering?.term) {
        term = link.offering.term;
      }
      if (link.offering?.instructor) {
        if (Array.isArray(link.offering.instructor)) {
          instructors = link.offering.instructor;
        } else if (typeof link.offering.instructor === 'string') {
          instructors = [link.offering.instructor];
        }
      }
      // 从course中获取课程名称和院系信息（如果有）
      if (link.offering?.course) {
        courseNameFromApi = link.offering.course.name;
        courseDept = link.offering.course.dept;
      }
    }
    
    // 从tags中查找学期（如果offering中没有）
    if (!term) {
      term = tags.find(tag => /^\d{4}[春秋]$/.test(tag));
    }
    
    // 从tags中查找课程代码（兼容中英文前缀）
    const courseCodeTag = tags.find(tag => 
      tag.startsWith(TAG_PREFIXES.COURSE_CODE_ZH) || tag.startsWith(TAG_PREFIXES.COURSE_CODE_EN)
    );
    
    // 从tags中查找其他tag（排除课程代码、学期和已经在instructors中的老师）
    const otherTags = tags.filter(tag => 
      !tag.startsWith(TAG_PREFIXES.COURSE_CODE_ZH) && 
      !tag.startsWith(TAG_PREFIXES.COURSE_CODE_EN) &&
      !/^\d{4}[春秋]$/.test(tag) &&
      !instructors.includes(tag)
    );

    return {
      term,
      courseNameFromTags: courseNameFromApi ? [courseNameFromApi] : [],
      courseCode: courseCodeTag?.replace(TAG_PREFIXES.COURSE_CODE_ZH, '').replace(TAG_PREFIXES.COURSE_CODE_EN, ''),
      instructors,
      others: otherTags,
      courseDept
    };
  };

  const { term, courseNameFromTags, courseCode, instructors, others, courseDept } = parseTags();
  
  // 优先使用从 offering 获取的课程名称，如果没有则使用props传入的
  const displayCourseName = (courseNameFromTags && courseNameFromTags.length > 0) ? courseNameFromTags[0] : courseName;

  // 处理文件下载
  const handleDownload = async () => {
    if (resource.type !== 'file' || !resource.url_or_path) {
      return;
    }

    try {
      const API_BASE_URL = `${backendUrl}/api`;
      const headers = getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/resources/${resource.id}/download`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // 获取文件名
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = resource.title;
      
      if (contentDisposition) {
        // 优先尝试解析 filename* (RFC 5987格式，支持UTF-8)
        const filenameStarMatch = contentDisposition.match(/filename\*=utf-8''([^;]+)/i);
        if (filenameStarMatch && filenameStarMatch[1]) {
          try {
            fileName = decodeURIComponent(filenameStarMatch[1]);
          } catch (e) {
            // 如果解码失败，尝试解析普通filename
            const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
            if (filenameMatch && filenameMatch[1]) {
              fileName = filenameMatch[1].replace(/['"]/g, '');
            }
          }
        } else {
          // 如果没有filename*，尝试解析普通filename
          const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
          if (filenameMatch && filenameMatch[1]) {
            fileName = filenameMatch[1].replace(/['"]/g, '');
            // 尝试解码（可能是URL编码的）
            try {
              fileName = decodeURIComponent(fileName);
            } catch (e) {
              // 如果解码失败，使用原始文件名
            }
          }
        }
      }
      
      // 确保文件名有扩展名（从url_or_path中提取）
      if (resource.url_or_path && !fileName.includes('.')) {
        const ext = resource.url_or_path.match(/\.([^.]+)$/);
        if (ext && ext[1]) {
          fileName = `${fileName}.${ext[1]}`;
        }
      }

      // 创建blob并下载
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert(t('allCourses.resource.downloadFailed') || '下载失败');
    }
  };

  const uploader = resource.uploader;
  const displayChar = uploader?.nickname?.trim()?.charAt(0)?.toUpperCase() || '';

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={
        <div className={styles.titleContainer}>
          <span className={styles.titleText}>{resource.title}</span>
          {uploader && (
            <div className={styles.uploaderInfo} onClick={handleUploaderClick}>
              {uploaderAvatar ? (
                <div className={styles.uploaderAvatar}>
                  <Image
                    src={uploaderAvatar}
                    alt={uploader.nickname}
                    fill
                    className={styles.avatarImage}
                  />
                </div>
              ) : (
                <div className={styles.uploaderAvatarFallback}>
                  {displayChar}
                </div>
              )}
              <span className={styles.uploaderName}>{uploader.nickname}</span>
            </div>
          )}
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

        {/* 资源描述 */}
        {resource.description && (
          <div className={styles.section}>
            <div className={styles.description}>{resource.description}</div>
          </div>
        )}

        {/* 文件下载 */}
        {resource.type === 'file' && resource.url_or_path && (
          <div className={styles.section}>
            <button
              type="button"
              className={styles.downloadButton}
              onClick={handleDownload}
            >
              <svg className={styles.downloadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {t('allCourses.resource.download') || '下载文件'}
            </button>
          </div>
        )}

        {/* Tags */}
        <div className={styles.section}>
          <div className={styles.tagsContainer}>
            {term && (
              <span className={`${styles.tag} ${styles.tagTerm}`}>{term}</span>
            )}
            {courseNameFromTags.map((name, index) => (
              <span key={index} className={`${styles.tag} ${styles.tagCourseName}`}>
                {name}
              </span>
            ))}
            {courseCode && (
              <span className={`${styles.tag} ${styles.tagCourseCode}`}>
                {courseCode}
              </span>
            )}
            {instructors.map((instructor, index) => (
              <span key={index} className={`${styles.tag} ${styles.tagInstructor}`}>
                {instructor}
              </span>
            ))}
            {others.map((tag, index) => (
              <span key={index} className={`${styles.tag} ${styles.tagOther}`}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 回复列表 */}
        <div className={styles.section}>
          <div className={styles.commentsHeader}>
            <span className={styles.commentsTitle}>
              {t('allCourses.review.comments')} ({comments.length})
            </span>
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
          {/* 回复输入框 */}
          {showReplyInput && (
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
          )}
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
              {comments.map((comment, index) => (
                <CommentItem 
                  key={comment.id} 
                  comment={comment}
                  commentNumber={index + 1}
                  showReportButton={showReportButton}
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
  comment: ResourceComment;
  commentNumber: number;
  showReportButton?: boolean;
  onUpdate?: (updatedComment: ResourceComment) => void;
}

function CommentItem({ comment, commentNumber, showReportButton = true, onUpdate }: CommentItemProps) {
  const { t, i18n } = useTranslation('common');
  const router = useRouter();
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(comment.userReaction === 'like');
  const [isDisliked, setIsDisliked] = useState(comment.userReaction === 'dislike');
  const [likeCount, setLikeCount] = useState(comment.stats?.like_count || 0);
  const [dislikeCount, setDislikeCount] = useState(comment.stats?.dislike_count || 0);
  const [showReportModal, setShowReportModal] = useState(false);

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
      const response = await reactToResourceComment(comment.id, 'like');
      if (response.status === 'success' && response.data) {
        const newReaction = response.data.reaction;
        setIsLiked(newReaction === 'like');
        setIsDisliked(false);
        if (response.data.stats) {
          setLikeCount(response.data.stats.like_count || 0);
          setDislikeCount(response.data.stats.dislike_count || 0);
        }
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
      const response = await reactToResourceComment(comment.id, 'dislike');
      if (response.status === 'success' && response.data) {
        const newReaction = response.data.reaction;
        setIsDisliked(newReaction === 'dislike');
        setIsLiked(false);
        if (response.data.stats) {
          setLikeCount(response.data.stats.like_count || 0);
          setDislikeCount(response.data.stats.dislike_count || 0);
        }
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
          {formatDateTime(comment.created_at, i18n.language)}
        </span>
      </div>
      <div className={styles.commentContent}>{comment.content}</div>
      <div className={styles.commentFooter}>
        <span className={styles.commentNumber}>#{commentNumber}</span>
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
            {showReportButton && (
              <Tooltip title={t('report.title')}>
                <button
                  type="button"
                  className={styles.commentReportButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReportModal(true);
                  }}
                >
                  <svg
                    className={styles.commentReportIcon}
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
            )}
          </div>
        </div>
      </div>
      <ReportModal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        entityType="resource_comment"
        entityId={comment.id}
      />
    </div>
  );
}

