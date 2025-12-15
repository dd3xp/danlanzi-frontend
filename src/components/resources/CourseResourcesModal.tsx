import React, { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { useTranslation } from 'next-i18next';
import { getResources, Resource, favoriteResource, unfavoriteResource, likeResource, unlikeResource } from '@/services/resourceService';
import ResourceDetailModal from './ResourceDetailModal';
import ResourceCard from './ResourceCard';
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
  const [likedResources, setLikedResources] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (open && courseId) {
      loadResources();
    } else {
      // 关闭模态框时清空状态
      setResources([]);
      setFavoritedResources(new Set());
      setLikedResources(new Set());
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
        // 从API响应中获取收藏和点赞状态
        const favoritedIds = new Set(
          response.data.resources
            .filter((r: Resource) => r.isFavorited === true)
            .map((r: Resource) => r.id)
        );
        const likedIds = new Set(
          response.data.resources
            .filter((r: Resource) => r.isLiked === true)
            .map((r: Resource) => r.id)
        );
        setFavoritedResources(favoritedIds);
        setLikedResources(likedIds);
      }
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理收藏/取消收藏
  const handleFavorite = async (resourceId: number) => {
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
            return newSet;
          });
        } else {
          setFavoritedResources(prev => new Set(prev).add(resourceId));
        }
        
        // 更新资源列表中的收藏状态和统计
        const updateResourceFavorite = (resource: Resource) => {
          if (resource.id === resourceId) {
            const newStats = resource.stats ? {
              ...resource.stats,
              favorite_count: isFavorited 
                ? Math.max(0, (resource.stats.favorite_count || 0) - 1)
                : (resource.stats.favorite_count || 0) + 1
            } : {
              favorite_count: isFavorited ? 0 : 1,
              like_count: 0,
              download_count: 0,
              view_count: 0
            };
            return { 
              ...resource, 
              isFavorited: !isFavorited,
              stats: newStats
            };
          }
          return resource;
        };
        
        setResources(prev => prev.map(updateResourceFavorite));
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

  // 处理点赞/取消点赞
  const handleLike = async (resourceId: number) => {
    const isLiked = likedResources.has(resourceId);
    
    try {
      const response = isLiked
        ? await unlikeResource(resourceId)
        : await likeResource(resourceId);
      
      if (response.status === 'success') {
        if (isLiked) {
          setLikedResources(prev => {
            const newSet = new Set(prev);
            newSet.delete(resourceId);
            return newSet;
          });
        } else {
          setLikedResources(prev => new Set(prev).add(resourceId));
        }
        
        // 更新资源列表中的点赞状态和统计
        const updateResourceLike = (resource: Resource) => {
          if (resource.id === resourceId) {
            const newStats = resource.stats ? {
              ...resource.stats,
              like_count: isLiked 
                ? Math.max(0, (resource.stats.like_count || 0) - 1)
                : (resource.stats.like_count || 0) + 1
            } : {
              favorite_count: 0,
              like_count: isLiked ? 0 : 1,
              download_count: 0,
              view_count: 0
            };
            return { 
              ...resource, 
              isLiked: !isLiked,
              stats: newStats
            };
          }
          return resource;
        };
        
        setResources(prev => prev.map(updateResourceLike));
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  // 处理查看详情
  const handleViewDetail = (resource: Resource) => {
    setSelectedResource(resource);
    setDetailModalOpen(true);
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
            const isFavorited = favoritedResources.has(resource.id);
            const isLiked = likedResources.has(resource.id);
            return (
              <ResourceCard
                key={resource.id}
                resource={resource}
                isFavorited={isFavorited}
                isLiked={isLiked}
                onFavorite={handleFavorite}
                onLike={handleLike}
                onViewDetail={handleViewDetail}
              />
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

