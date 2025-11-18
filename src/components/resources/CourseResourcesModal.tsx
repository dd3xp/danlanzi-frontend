import React, { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { useTranslation } from 'next-i18next';
import { getResources, Resource, favoriteResource, unfavoriteResource } from '@/services/resourceService';
import ResourceDetailModal from './ResourceDetailModal';
import Tooltip from '@/components/global/Tooltip';
import styles from '@/styles/resources/CourseResourcesModal.module.css';

interface CourseResourcesModalProps {
  open: boolean;
  onClose: () => void;
  courseId: number;
  courseName: string;
}

export default function CourseResourcesModal({ open, onClose, courseId, courseName }: CourseResourcesModalProps) {
  const { t } = useTranslation('common');
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [favoritedResources, setFavoritedResources] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (open && courseId) {
      loadResources();
    } else {
      // 关闭模态框时清空状态
      setResources([]);
      setFavoritedResources(new Set());
    }
  }, [open, courseId]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const response = await getResources({
        course_id: courseId,
        limit: 100,
      });
      if (response.status === 'success' && response.data) {
        setResources(response.data.resources);
        // 从API响应中获取收藏状态
        const favoritedIds = new Set(
          response.data.resources
            .filter((r: Resource) => r.isFavorited === true)
            .map((r: Resource) => r.id)
        );
        setFavoritedResources(favoritedIds);
        // 调试日志
        console.log('Loaded resources with favorites:', favoritedIds);
      }
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理收藏/取消收藏
  const handleFavorite = async (e: React.MouseEvent, resourceId: number) => {
    e.stopPropagation();
    const isFavorited = favoritedResources.has(resourceId);
    
    try {
      let response;
      if (isFavorited) {
        response = await unfavoriteResource(resourceId);
      } else {
        response = await favoriteResource(resourceId);
      }
      
      // 检查响应状态
      if (response.status === 'success') {
        if (isFavorited) {
          setFavoritedResources(prev => {
            const newSet = new Set(prev);
            newSet.delete(resourceId);
            console.log('Unfavorited resource:', resourceId, 'New set:', newSet);
            return newSet;
          });
        } else {
          setFavoritedResources(prev => {
            const newSet = new Set(prev).add(resourceId);
            console.log('Favorited resource:', resourceId, 'New set:', newSet);
            return newSet;
          });
        }
      } else {
        console.error('Failed to toggle favorite:', response);
        // 如果是认证错误，可能需要重新登录
        if (response.code === 'TOKEN_EXPIRED' || response.code === 'TOKEN_INVALID' || response.code === 'TOKEN_MISSING') {
          // apiClient会自动处理token过期，这里不需要额外操作
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  // 处理查看详情
  const handleViewDetail = (resource: Resource) => {
    setSelectedResource(resource);
    setDetailModalOpen(true);
  };

  // 解析tags，提取不同类型
  const parseTags = (resource: Resource) => {
    const tags = resource.tags || [];
    
    // 从offering中获取学期信息
    let term: string | undefined;
    let instructors: string[] = [];
    if (resource.courseLinks && resource.courseLinks.length > 0) {
      const link = resource.courseLinks[0];
      if (link.offering?.term) {
        term = link.offering.term;
      }
      if (link.offering?.instructor) {
        // 处理instructor可能是字符串或数组的情况
        if (Array.isArray(link.offering.instructor)) {
          instructors = link.offering.instructor;
        } else if (typeof link.offering.instructor === 'string') {
          instructors = [link.offering.instructor];
        }
      }
    }
    
    // 从tags中查找学期（如果offering中没有）
    if (!term) {
      term = tags.find(tag => /^\d{4}[春秋]$/.test(tag));
    }
    
    // 从tags中查找课程代码
    const courseCodeTag = tags.find(tag => tag.startsWith('课程代码:'));
    
    // 从tags中查找其他tag（排除课程代码、学期和已经在instructors中的老师）
    const otherTags = tags.filter(tag => 
      !tag.startsWith('课程代码:') && 
      !/^\d{4}[春秋]$/.test(tag) &&
      !instructors.includes(tag)
    );

    return {
      term,
      courseCode: courseCodeTag?.replace('课程代码:', ''),
      instructors,
      others: otherTags
    };
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={courseName}
      width={800}
      className={styles.modal}
    >
      <div className={styles.resourcesList}>
        {loading ? (
          <div className={styles.loadingState}>
            <p>{t('allCourses.states.loading')}</p>
          </div>
        ) : resources.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{t('allCourses.resource.noResources')}</p>
          </div>
        ) : (
                resources.map((resource) => {
                  const { term, courseCode, instructors, others } = parseTags(resource);
                  const isFavorited = favoritedResources.has(resource.id);
                  return (
                    <div 
                      key={resource.id} 
                      className={styles.resourceCard}
                    >
                      <div className={styles.resourceCardContent}>
                        <div className={styles.resourceTitle}>{resource.title}</div>
                        <div className={styles.tagsContainer}>
                          {term && (
                            <span className={`${styles.tag} ${styles.tagTerm}`}>{term}</span>
                          )}
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
                      <div className={styles.cardActions}>
                        <Tooltip title={isFavorited ? t('allCourses.resource.unfavorite') || '取消收藏' : t('allCourses.resource.favorite') || '收藏'}>
                          <button
                            type="button"
                            className={styles.favoriteButton}
                            onClick={(e) => handleFavorite(e, resource.id)}
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
                          </button>
                        </Tooltip>
                        <Tooltip title={t('allCourses.resource.viewDetail') || '查看详情'}>
                          <button
                            type="button"
                            className={styles.viewButton}
                            onClick={() => handleViewDetail(resource)}
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
                      </div>
                    </div>
                  );
                })
        )}
      </div>
      {selectedResource && (
        <ResourceDetailModal
          open={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedResource(null);
          }}
          resource={selectedResource}
          courseName={courseName}
        />
      )}
    </Modal>
  );
}

