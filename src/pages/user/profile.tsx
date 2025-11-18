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
import { getResources, Resource, favoriteResource, unfavoriteResource, deleteResource } from '@/services/resourceService';
import ResourceDetailModal from '@/components/resources/ResourceDetailModal';
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
        
        // 初始化收藏状态
        const favoritedSet = new Set<number>();
        response.data.resources.forEach(resource => {
          if (resource.isFavorited) {
            favoritedSet.add(resource.id);
          }
        });
        setFavoritedResources(favoritedSet);
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
  const handleFavorite = async (e: React.MouseEvent, resourceId: number) => {
    e.stopPropagation();
    
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
        
        // 更新资源列表中的收藏状态
        const updateResourceFavorite = (resource: Resource) => {
          if (resource.id === resourceId) {
            return { ...resource, isFavorited: !isFavorited };
          }
          return resource;
        };
        
        setResources(prev => prev.map(updateResourceFavorite));
      }
    } catch (err) {
      console.error('Favorite toggle failed:', err);
    }
  };

  // 处理查看详情
  const handleViewDetail = (resource: Resource) => {
    setSelectedResource(resource);
    setResourceDetailModalOpen(true);
  };

  // 处理删除资源
  const handleDelete = (e: React.MouseEvent, resource: Resource) => {
    e.stopPropagation();
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
    // 判断是否是当前用户查看自己的资源
    const isCurrentUserResource = currentUser && user && currentUser.id === user.id && resource.uploader_id === currentUser.id;
    
    // 解析tags
    const parseTags = () => {
      const term: string[] = [];
      const courseCode: string[] = [];
      const instructors: string[] = [];
      const others: string[] = [];
      
      if (resource.courseLinks && resource.courseLinks.length > 0) {
        resource.courseLinks.forEach(link => {
          if (link.offering) {
            if (link.offering.term) {
              term.push(link.offering.term);
            }
            if (link.offering.instructor) {
              const instructorArray = Array.isArray(link.offering.instructor)
                ? link.offering.instructor
                : [link.offering.instructor];
              instructors.push(...instructorArray);
            }
            if (link.offering.course) {
              if (link.offering.course.name) {
                courseCode.push(link.offering.course.name);
              }
            }
          }
        });
      }
      
      if (resource.tags && Array.isArray(resource.tags)) {
        resource.tags.forEach(tag => {
          if (typeof tag === 'string') {
            if (tag.startsWith('开课学期:') || tag.startsWith('Term:')) {
              const termValue = tag.split(':')[1]?.trim();
              if (termValue && !term.includes(termValue)) {
                term.push(termValue);
              }
            } else if (tag.startsWith('课程代码:') || tag.startsWith('Course Code:')) {
              const codeValue = tag.split(':')[1]?.trim();
              if (codeValue && !courseCode.includes(codeValue)) {
                courseCode.push(codeValue);
              }
            } else if (tag.startsWith('开课老师:') || tag.startsWith('Instructor:')) {
              const instructorValue = tag.split(':')[1]?.trim();
              if (instructorValue && !instructors.includes(instructorValue)) {
                instructors.push(instructorValue);
              }
            } else {
              others.push(tag);
            }
          }
        });
      }
      
      return { term, courseCode, instructors, others };
    };
    
    const { term, courseCode, instructors, others } = parseTags();
    
    return (
      <div key={resource.id} className={resourceStyles.resourceCard}>
        <div className={resourceStyles.resourceCardContent}>
          <div className={resourceStyles.resourceTitle}>{resource.title}</div>
          <div className={resourceStyles.tagsContainer}>
            {term.map((t, idx) => (
              <span key={`term-${idx}`} className={`${resourceStyles.tag} ${resourceStyles.tagTerm}`}>
                {t}
              </span>
            ))}
            {courseCode.map((code, idx) => (
              <span key={`code-${idx}`} className={`${resourceStyles.tag} ${resourceStyles.tagCourseCode}`}>
                {code}
              </span>
            ))}
            {instructors.map((inst, idx) => (
              <span key={`inst-${idx}`} className={`${resourceStyles.tag} ${resourceStyles.tagInstructor}`}>
                {inst}
              </span>
            ))}
            {others.map((other, idx) => (
              <span key={`other-${idx}`} className={`${resourceStyles.tag} ${resourceStyles.tagOther}`}>
                {other}
              </span>
            ))}
          </div>
        </div>
        <div className={resourceStyles.cardActions}>
          <Tooltip title={isFavorited ? t('allCourses.resource.unfavorite') : t('allCourses.resource.favorite')}>
            <button
              type="button"
              className={resourceStyles.favoriteButton}
              onClick={(e) => handleFavorite(e, resource.id)}
            >
              <svg
                className={`${resourceStyles.starIcon} ${isFavorited ? resourceStyles.starFilled : ''}`}
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
          {isCurrentUserResource && (
            <Tooltip title={t('myResources.delete')}>
              <button
                type="button"
                className={resourceStyles.deleteButton}
                onClick={(e) => handleDelete(e, resource)}
              >
                <svg
                  className={resourceStyles.deleteIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            </Tooltip>
          )}
          <Tooltip title={t('allCourses.resource.viewDetail')}>
            <button
              type="button"
              className={resourceStyles.viewButton}
              onClick={() => handleViewDetail(resource)}
            >
              <svg
                className={resourceStyles.arrowIcon}
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


