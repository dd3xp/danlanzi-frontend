import React, { useEffect, useState, useRef } from 'react';
import SideBar from '@/components/global/SideBar';
import Avatar from '@/components/global/Avatar';
import ProtectedRoute from '@/components/global/ProtectedRoute';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Tooltip from '@/components/global/Tooltip';
import AddResourceModal from '@/components/resources/AddResourceModal';
import ConfirmDialog from '@/components/global/ConfirmDialog';
import styles from '@/styles/all-courses/AllCourses.module.css';
import { getResources, Resource, favoriteResource, unfavoriteResource, deleteResource, likeResource, unlikeResource } from '@/services/resourceService';
import ResourceDetailModal from '@/components/resources/ResourceDetailModal';
import ResourceCard from '@/components/resources/ResourceCard';
import { translateBackendMessage } from '@/utils/translator';
import { showToast } from '@/components/global/Toast';

type TabType = 'favorited' | 'uploaded';

const SEARCH_HISTORY_KEY = 'my_resource_search_history';
const MAX_HISTORY_ITEMS = 10;

export default function MyResources() {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<TabType>('favorited');
  const [favoritedResourcesList, setFavoritedResourcesList] = useState<Resource[]>([]);
  const [uploadedResourcesList, setUploadedResourcesList] = useState<Resource[]>([]);
  const [favoritedLoading, setFavoritedLoading] = useState(true);
  const [uploadedLoading, setUploadedLoading] = useState(true);
  const [favoritedError, setFavoritedError] = useState<string | null>(null);
  const [uploadedError, setUploadedError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [addResourceModalOpen, setAddResourceModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Resource[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [resourceDetailModalOpen, setResourceDetailModalOpen] = useState(false);
  const [favoritedResources, setFavoritedResources] = useState<Set<number>>(new Set());
  const [likedResources, setLikedResources] = useState<Set<number>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // 加载搜索历史
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const history = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) {
        try {
          setSearchHistory(JSON.parse(history));
        } catch (e) {
          console.error('Failed to parse search history:', e);
        }
      }
    }
  }, []);

  // 保存搜索历史
  const saveSearchHistory = (query: string) => {
    if (!query.trim()) return;
    
    const trimmedQuery = query.trim();
    const newHistory = [trimmedQuery, ...searchHistory.filter(item => item !== trimmedQuery)]
      .slice(0, MAX_HISTORY_ITEMS);
    
    setSearchHistory(newHistory);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    }
  };

  // 删除搜索历史
  const deleteHistoryItem = (item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = searchHistory.filter(h => h !== item);
    setSearchHistory(newHistory);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    }
  };

  // 点击历史记录项
  const handleHistoryClick = (item: string) => {
    setSearchQuery(item);
    setShowHistory(false);
    performSearch(item);
  };

  // 执行搜索
  const performSearch = async (query: string) => {
    const trimmedQuery = query.trim();
    
    if (trimmedQuery) {
      setHasSearched(true);
      setIsSearching(true);
      setSearchLoading(true);
      
      try {
        const params: any = {
          search: trimmedQuery,
          limit: 100
        };
        
        // 根据当前tab添加筛选条件
        if (activeTab === 'favorited') {
          params.favorite = true;
        } else {
          params.uploader_id = 'current';
        }
        
        const response = await getResources(params);
        
        if (response.status === 'success' && response.data) {
          // 后端已经根据activeTab过滤了资源
          setSearchResults(response.data.resources);
          
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
          
          saveSearchHistory(trimmedQuery);
        } else {
          setSearchResults([]);
        }
      } catch (err: any) {
        console.error('Search failed:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
        setIsSearching(false);
      }
    } else {
      // 清空搜索
      setHasSearched(false);
      setSearchResults([]);
      // 重新加载当前tab的数据
      if (activeTab === 'favorited') {
        loadFavoritedResources();
      } else {
        loadUploadedResources();
      }
    }
  };

  // 加载收藏的资源
  const loadFavoritedResources = async () => {
    setFavoritedLoading(true);
    setFavoritedError(null);
    
    try {
      const response = await getResources({
        favorite: true,
        limit: 100
      });
      
      if (response.status === 'success' && response.data) {
        setFavoritedResourcesList(response.data.resources);
        
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
        setFavoritedResources(prev => {
          const newSet = new Set(prev);
          if (response.data) {
            response.data.resources.forEach(resource => {
              if (resource.isFavorited) {
                newSet.add(resource.id);
              }
            });
          }
          return newSet;
        });
        setLikedResources(prev => {
          const newSet = new Set(prev);
          if (response.data) {
            response.data.resources.forEach(resource => {
              if (resource.isLiked) {
                newSet.add(resource.id);
              }
            });
          }
          return newSet;
        });
      } else {
        setFavoritedError(translateBackendMessage(response, t) || t('myResources.states.loadFailed'));
      }
    } catch (err: any) {
      console.error('Load favorited resources failed:', err);
      setFavoritedError(translateBackendMessage(err.message || 'Failed to load resources', t) || t('myResources.states.loadFailed'));
    } finally {
      setFavoritedLoading(false);
    }
  };

  // 加载发布的资源
  const loadUploadedResources = async () => {
    setUploadedLoading(true);
    setUploadedError(null);
    
    try {
      const response = await getResources({
        uploader_id: 'current',
        limit: 100
      });
      
      if (response.status === 'success' && response.data) {
        setUploadedResourcesList(response.data.resources);
        
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
        setFavoritedResources(prev => {
          const newSet = new Set(prev);
          if (response.data) {
            response.data.resources.forEach(resource => {
              if (resource.isFavorited) {
                newSet.add(resource.id);
              }
            });
          }
          return newSet;
        });
        setLikedResources(prev => {
          const newSet = new Set(prev);
          if (response.data) {
            response.data.resources.forEach(resource => {
              if (resource.isLiked) {
                newSet.add(resource.id);
              }
            });
          }
          return newSet;
        });
      } else {
        setUploadedError(translateBackendMessage(response, t) || t('myResources.states.loadFailed'));
      }
    } catch (err: any) {
      console.error('Load uploaded resources failed:', err);
      setUploadedError(translateBackendMessage(err.message || 'Failed to load resources', t) || t('myResources.states.loadFailed'));
    } finally {
      setUploadedLoading(false);
    }
  };

  // 初始加载：同时加载两个tab的数据
  useEffect(() => {
    if (!hasSearched) {
      loadFavoritedResources();
      loadUploadedResources();
    }
  }, []);

  // 处理搜索输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowHistory(value.trim() === '');
    
    if (value.trim() === '') {
      setHasSearched(false);
      setSearchResults([]);
      // 重新加载当前tab的数据
      if (activeTab === 'favorited') {
        loadFavoritedResources();
      } else {
        loadUploadedResources();
      }
    }
  };

  // 处理搜索提交
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowHistory(false);
    performSearch(searchQuery);
  };


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
        
        setFavoritedResourcesList(prev => prev.map(updateResourceFavorite));
        setUploadedResourcesList(prev => prev.map(updateResourceFavorite));
        setSearchResults(prev => prev.map(updateResourceFavorite));
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
        
        setFavoritedResourcesList(prev => prev.map(updateResourceLike));
        setUploadedResourcesList(prev => prev.map(updateResourceLike));
        setSearchResults(prev => prev.map(updateResourceLike));
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
        setFavoritedResourcesList(prev => prev.filter(r => r.id !== resourceToDelete.id));
        setUploadedResourcesList(prev => prev.filter(r => r.id !== resourceToDelete.id));
        setSearchResults(prev => prev.filter(r => r.id !== resourceToDelete.id));
        
        // 如果当前显示的是搜索结果，且结果为空，可以清空搜索
        if (hasSearched && searchResults.length === 1) {
          setHasSearched(false);
          setSearchQuery('');
        }
        
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

  // 点击外部关闭搜索历史
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 渲染资源卡片
  const renderResourceCard = (resource: Resource, showDelete: boolean = false) => {
    const isFavorited = favoritedResources.has(resource.id);
    const isLiked = likedResources.has(resource.id);
    
    return (
      <ResourceCard
        key={resource.id}
        resource={resource}
        isFavorited={isFavorited}
        isLiked={isLiked}
        showDelete={showDelete}
        onFavorite={handleFavorite}
        onLike={handleLike}
        onDelete={handleDelete}
        onViewDetail={handleViewDetail}
      />
    );
  };

  // 渲染搜索结果
  const renderSearchResults = () => {
    if (searchLoading) {
      return (
        <div className={styles.loadingState}>
          <p className={styles.loadingText}>{t('allCourses.states.loading')}</p>
        </div>
      );
    }

    if (searchResults.length === 0 && searchQuery.trim()) {
      return (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateText}>{t('allCourses.search.noResults')}</p>
        </div>
      );
    }

    if (searchResults.length === 0) {
      return null;
    }

    return (
      <div className={styles.resourcesList}>
        {searchResults.map(resource => {
          // 搜索结果中，只有当前用户上传的资源才显示删除按钮
          const showDelete = uploadedResourcesList.some(r => r.id === resource.id);
          return renderResourceCard(resource, showDelete);
        })}
      </div>
    );
  };

  // 渲染资源列表
  const renderResources = () => {
    const currentResources = activeTab === 'favorited' ? favoritedResourcesList : uploadedResourcesList;
    const isLoading = activeTab === 'favorited' ? favoritedLoading : uploadedLoading;
    const currentError = activeTab === 'favorited' ? favoritedError : uploadedError;

    if (isLoading) {
      return (
        <div className={styles.loadingState}>
          <p className={styles.loadingText}>{t('allCourses.states.loading')}</p>
        </div>
      );
    }

    if (currentError) {
      return (
        <div className={styles.errorState}>
          <p className={styles.errorText}>
            {currentError === 'Failed to load resources'
              ? t('allCourses.states.loadFailed')
              : currentError}
          </p>
        </div>
      );
    }

    if (currentResources.length === 0) {
      return (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateText}>
            {activeTab === 'favorited'
              ? t('myResources.states.noFavorited')
              : t('myResources.states.noUploaded')}
          </p>
        </div>
      );
    }

    return (
      <div className={styles.resourcesList}>
        {currentResources.map(resource => renderResourceCard(resource, activeTab === 'uploaded'))}
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <SideBar />
      <Avatar />
      <main className="app-main">
        <div className={styles.container}>
          <div className={styles.searchContainer} ref={searchContainerRef}>
            <div className={styles.searchWrapper}>
              <form className={styles.searchBox} onSubmit={handleSearchSubmit}>
                <input
                  ref={searchInputRef}
                  type="text"
                  className={styles.searchInput}
                  placeholder={t('myResources.search.placeholder')}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setShowHistory(true)}
                />
                <svg
                  className={styles.searchIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </form>
              <Tooltip title={t('allCourses.resource.addResource')}>
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={() => setAddResourceModalOpen(true)}
                  aria-label={t('allCourses.resource.addResource')}
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
            
            {showHistory && searchHistory.length > 0 && (
              <div className={styles.searchHistory}>
                {searchHistory.map((item, index) => (
                  <div
                    key={index}
                    className={styles.historyItem}
                    onClick={() => handleHistoryClick(item)}
                  >
                    <div className={styles.historyItemContent}>
                      <svg
                        className={styles.historyIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                        <path d="M3 21v-5h5" />
                      </svg>
                      <span className={styles.historyText}>{item}</span>
                    </div>
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={(e) => deleteHistoryItem(item, e)}
                      aria-label={t('allCourses.search.deleteHistory')}
                    >
                      <svg
                        className={styles.deleteIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!hasSearched && (
            <>
              <div className={styles.header}>
                <h1 className={styles.title}>{t('myResources.title')}</h1>
                <p className={styles.subtitle}>{t('myResources.subtitle')}</p>
              </div>

              <div className={styles.tabs}>
                <button
                  type="button"
                  className={`${styles.tab} ${activeTab === 'favorited' ? styles.active : ''}`}
                  onClick={() => setActiveTab('favorited')}
                >
                  {t('myResources.tabs.favorited')}
                </button>
                <button
                  type="button"
                  className={`${styles.tab} ${activeTab === 'uploaded' ? styles.active : ''}`}
                  onClick={() => setActiveTab('uploaded')}
                >
                  {t('myResources.tabs.uploaded')}
                </button>
              </div>

              <div className={styles.tabPanel}>
                {renderResources()}
              </div>
            </>
          )}

          {hasSearched && (
            <div className={styles.tabPanel}>
              {renderSearchResults()}
            </div>
          )}

          <AddResourceModal
            open={addResourceModalOpen}
            onClose={() => {
              setAddResourceModalOpen(false);
              // 重新加载当前tab的数据
              if (activeTab === 'favorited') {
                loadFavoritedResources();
              } else {
                loadUploadedResources();
              }
            }}
          />

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

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'zh', ['common'])),
  },
});
