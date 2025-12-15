import React, { useEffect, useState } from 'react';
import SideBar from '@/components/global/SideBar';
import Avatar from '@/components/global/Avatar';
import ProtectedRoute from '@/components/global/ProtectedRoute';
import ProfileCard from '@/components/profile/ProfileCard';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import styles from '@/styles/profile/Profile.module.css';
import resourceStyles from '@/styles/all-courses/AllCourses.module.css';
import { getUserProfile } from '@/services/userProfileService';
import { getUserAvatar } from '@/services/userAvatarService';
import { useRouter } from 'next/router';
import { getUser } from '@/utils/auth';
import { getResources, Resource, favoriteResource, unfavoriteResource, deleteResource, likeResource, unlikeResource } from '@/services/resourceService';
import ResourceDetailModal from '@/components/resources/ResourceDetailModal';
import ResourceCard from '@/components/resources/ResourceCard';
import Tooltip from '@/components/global/Tooltip';
import ConfirmDialog from '@/components/global/ConfirmDialog';
import { showToast } from '@/components/global/Toast';
import { translateBackendMessage } from '@/utils/translator';

export default function UserProfilePage() {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'messages'>('overview');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const currentUser = getUser();
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourcesError, setResourcesError] = useState<string | null>(null);
  const [favoritedResources, setFavoritedResources] = useState<Set<number>>(new Set());
  const [likedResources, setLikedResources] = useState<Set<number>>(new Set());
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [resourceDetailModalOpen, setResourceDetailModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isSubscribed = true;
    const load = async () => {
      if (!router.isReady) return;

      // 每次路由变化时重置用户数据
      setUser(null);
      
      const userId = typeof router.query.id === 'string' ? router.query.id : undefined;
      const res = await getUserProfile(userId);
      if (!isSubscribed) return;
      
      if (res.status === 'success' && res.user) {
        const profile = res.user;
        const avatarRes = await getUserAvatar(profile.id);
        if (!isSubscribed) return;
        
        if (avatarRes.status === 'success' && avatarRes.avatar_data_url) {
          profile.avatar_data_url = avatarRes.avatar_data_url;
        }
        
        setUser(profile);
      }
    };
    
    load();

    // 清理函数
    return () => {
      isSubscribed = false;
    };
  }, [router.isReady, router.asPath]);

  // 加载用户发布的资源
  const loadUserResources = async (userId: number) => {
    setResourcesLoading(true);
    setResourcesError(null);
    
    try {
      const response = await getResources({
        uploader_id: userId,
        limit: 100
      });
      
      if (response.status === 'success' && response.data) {
        setResources(response.data.resources);
        
        // 初始化收藏和点赞状态
        const favoritedSet = new Set<number>();
        const likedSet = new Set<number>();
        response.data.resources.forEach(resource => {
          if (resource.isFavorited) {
            favoritedSet.add(resource.id);
          }
          if (resource.isLiked) {
            likedSet.add(resource.id);
          }
        });
        setFavoritedResources(favoritedSet);
        setLikedResources(likedSet);
      } else {
        setResourcesError(response.message || t('userProfile.placeholders.noResources'));
      }
    } catch (err: any) {
      console.error('Load user resources failed:', err);
      setResourcesError(err.message || t('userProfile.placeholders.noResources'));
    } finally {
      setResourcesLoading(false);
    }
  };

  // 当切换到resources tab或用户ID变化时加载资源
  useEffect(() => {
    if (activeTab === 'resources' && user?.id) {
      loadUserResources(user.id);
    }
  }, [activeTab, user?.id]);

  // 处理收藏/取消收藏
  const handleFavorite = async (resourceId: number) => {
    const isFavorited = favoritedResources.has(resourceId);
    
    try {
      const response = isFavorited
        ? await unfavoriteResource(resourceId)
        : await favoriteResource(resourceId);
      
      if (response.status === 'success') {
        const newFavorited = new Set(favoritedResources);
        if (isFavorited) {
          newFavorited.delete(resourceId);
        } else {
          newFavorited.add(resourceId);
        }
        setFavoritedResources(newFavorited);
        
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
      }
    } catch (err) {
      console.error('Favorite toggle failed:', err);
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
        const newLiked = new Set(likedResources);
        if (isLiked) {
          newLiked.delete(resourceId);
        } else {
          newLiked.add(resourceId);
        }
        setLikedResources(newLiked);
        
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
    } catch (err) {
      console.error('Like toggle failed:', err);
    }
  };

  // 处理查看详情
  const handleViewDetail = (resource: Resource) => {
    setSelectedResource(resource);
    setResourceDetailModalOpen(true);
  };

  // 处理删除资源
  const handleDelete = (resource: Resource) => {
    setResourceToDelete(resource);
    setDeleteConfirmOpen(true);
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!resourceToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await deleteResource(resourceToDelete.id);
      
      if (response.status === 'success') {
        showToast(t('myResources.deleteSuccess'), 'success');
        
        // 从列表中移除已删除的资源
        setResources(prev => prev.filter(r => r.id !== resourceToDelete.id));
        
        setDeleteConfirmOpen(false);
        setResourceToDelete(null);
      } else {
        const errorMessage = translateBackendMessage(response, t);
        showToast(errorMessage || t('myResources.deleteFailed'), 'error');
      }
    } catch (error) {
      console.error('Delete resource failed:', error);
      showToast(t('myResources.deleteFailed'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // 取消删除
  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setResourceToDelete(null);
  };

  // 渲染资源卡片
  const renderResourceCard = (resource: Resource) => {
    const isFavorited = favoritedResources.has(resource.id);
    const isLiked = likedResources.has(resource.id);
    // 判断是否是当前用户查看自己的资源
    const isCurrentUserResource = currentUser && user && currentUser.id === user.id && resource.uploader_id === currentUser.id;
    
    return (
      <ResourceCard
        key={resource.id}
        resource={resource}
        isFavorited={isFavorited}
        isLiked={isLiked}
        showDelete={isCurrentUserResource}
        onFavorite={handleFavorite}
        onLike={handleLike}
        onDelete={handleDelete}
        onViewDetail={handleViewDetail}
      />
    );
  };


  return (
    <ProtectedRoute>
      <SideBar />
      <Avatar />
      <main className="app-main">
        <div className={styles.profileContainer}>
          <div className={styles.tabs} role="tablist" aria-label={t('userProfile.tabs.ariaLabel')}>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'overview'}
              className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              {t('userProfile.tabs.overview')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'resources'}
              className={`${styles.tab} ${activeTab === 'resources' ? styles.active : ''}`}
              onClick={() => setActiveTab('resources')}
            >
              {t('userProfile.tabs.resources')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'messages'}
              className={`${styles.tab} ${activeTab === 'messages' ? styles.active : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              {t('userProfile.tabs.messages')}
            </button>
          </div>

          <section className={styles.tabPanel} role="tabpanel">
            {activeTab === 'overview' && user && (
              <ProfileCard 
                user={user} 
                onUserUpdate={setUser}
                isCurrentUser={!router.query.id || (!!currentUser && currentUser.id === user.id)}
              />
            )}
            {activeTab === 'resources' && (
              <>
                {resourcesLoading ? (
                  <div className={resourceStyles.loadingState}>
                    <p className={resourceStyles.loadingText}>{t('allCourses.states.loading')}</p>
                  </div>
                ) : resourcesError ? (
                  <div className={resourceStyles.errorState}>
                    <p className={resourceStyles.errorText}>{resourcesError}</p>
                  </div>
                ) : resources.length === 0 ? (
                  <div className={resourceStyles.emptyState}>
                    <p className={resourceStyles.emptyStateText}>{t('userProfile.placeholders.noResources')}</p>
                  </div>
                ) : (
                  <div className={resourceStyles.resourcesList}>
                    {resources.map(resource => renderResourceCard(resource))}
                  </div>
                )}
              </>
            )}
            {activeTab === 'messages' && (
              <>
                <h2 className={styles.sectionTitle}>{t('userProfile.sections.messages')}</h2>
                <p className={styles['text-muted']}>{t('userProfile.placeholders.noMessages')}</p>
              </>
            )}
          </section>

          {selectedResource && (
            <ResourceDetailModal
              open={resourceDetailModalOpen}
              onClose={() => {
                setResourceDetailModalOpen(false);
                setSelectedResource(null);
              }}
              resource={selectedResource}
            />
          )}
          <ConfirmDialog
            open={deleteConfirmOpen}
            title={t('myResources.deleteConfirm.title')}
            content={resourceToDelete ? t('myResources.deleteConfirm.content', { title: resourceToDelete.title }) : ''}
            okText={t('myResources.deleteConfirm.okText')}
            cancelText={t('myResources.deleteConfirm.cancelText')}
            okType="danger"
            onOk={handleConfirmDelete}
            onCancel={handleCancelDelete}
            loading={isDeleting}
          />
        </div>
      </main>
    </ProtectedRoute>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'zh', ['common', 'academic'])),
    },
  };
};


