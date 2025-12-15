import React, { useEffect, useState, useRef } from 'react';
import SideBar from '@/components/global/SideBar';
import Avatar from '@/components/global/Avatar';
import ProtectedRoute from '@/components/global/ProtectedRoute';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Tooltip from '@/components/global/Tooltip';
import AddResourceModal from '@/components/resources/AddResourceModal';
import CourseResourcesModal from '@/components/resources/CourseResourcesModal';
import CourseReviewsModal from '@/components/reviews/CourseReviewsModal';
import styles from '@/styles/all-courses/AllCourses.module.css';
import { getCourses, Course } from '@/services/courseService';
import { getResources, Resource, favoriteResource, unfavoriteResource, likeResource, unlikeResource } from '@/services/resourceService';
import ResourceDetailModal from '@/components/resources/ResourceDetailModal';
import ResourceCard from '@/components/resources/ResourceCard';

type TabType = 'name' | 'dept';

const SEARCH_HISTORY_KEY = 'resource_search_history';
const MAX_HISTORY_ITEMS = 10;

export default function AllCourses() {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<TabType>('name');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [addResourceModalOpen, setAddResourceModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [resourcesModalOpen, setResourcesModalOpen] = useState(false);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [searchResults, setSearchResults] = useState<Resource[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); // 标记是否已执行过搜索
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [resourceDetailModalOpen, setResourceDetailModalOpen] = useState(false);
  const [favoritedResources, setFavoritedResources] = useState<Set<number>>(new Set());
  const [likedResources, setLikedResources] = useState<Set<number>>(new Set());
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
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
      // 搜索资源
      setHasSearched(true);
      setIsSearching(true);
      setSearchLoading(true);
      setError(null);
      
      try {
        const response = await getResources({
          page: 1,
          limit: 100,
          search: trimmedQuery,
        });
        
        if (response.status === 'success' && response.data) {
          setSearchResults(response.data.resources);
          // 从API响应中获取收藏和点赞状态
          const favoritedIds = new Set(
            response.data.resources
              .filter((r: Resource) => r.isFavorited)
              .map((r: Resource) => r.id)
          );
          const likedIds = new Set(
            response.data.resources
              .filter((r: Resource) => r.isLiked)
              .map((r: Resource) => r.id)
          );
          setFavoritedResources(favoritedIds);
          setLikedResources(likedIds);
          saveSearchHistory(trimmedQuery);
        } else {
          setError(response.message || t('allCourses.states.loadFailed'));
          setSearchResults([]);
        }
      } catch (err) {
        setError(t('allCourses.states.networkError'));
        console.error('Failed to search resources:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
        setIsSearching(false);
      }
    } else {
      // 清空搜索，显示课程列表
      setHasSearched(false);
      setSearchResults([]);
      setError(null);
      // 重新加载课程列表
      setLoading(true);
      try {
        const response = await getCourses({
          page: 1,
          limit: 100,
        });
        
        if (response.status === 'success' && response.data) {
          setCourses(response.data.courses);
        }
      } catch (err) {
        console.error('Failed to fetch courses:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  // 初始加载课程
  useEffect(() => {
    if (!searchQuery.trim()) {
      setLoading(true);
      getCourses({
        page: 1,
        limit: 100,
      }).then(response => {
        if (response.status === 'success' && response.data) {
          setCourses(response.data.courses);
        }
      }).catch(err => {
        console.error('Failed to fetch courses:', err);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, []);

  // 处理搜索输入
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowHistory(value === '');
    
    // 如果清空搜索框，立即清空搜索结果并显示课程列表
    if (!value.trim()) {
      setHasSearched(false);
      setSearchResults([]);
      setError(null);
      // 重新加载课程列表
      setLoading(true);
      getCourses({
        page: 1,
        limit: 100,
      }).then(response => {
        if (response.status === 'success' && response.data) {
          setCourses(response.data.courses);
        }
      }).catch(err => {
        console.error('Failed to fetch courses:', err);
      }).finally(() => {
        setLoading(false);
      });
    }
    // 注意：不在输入时执行搜索，只在提交时搜索
  };

  // 处理搜索提交
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowHistory(false);
    performSearch(searchQuery);
  };

  // 点击外部关闭历史记录
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };

    if (showHistory) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showHistory]);

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
        
        setSearchResults(prev => prev.map(updateResourceFavorite));
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
        
        setSearchResults(prev => prev.map(updateResourceLike));
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  // 处理查看详情
  const handleViewDetail = (resource: Resource) => {
    setSelectedResource(resource);
    setResourceDetailModalOpen(true);
  };

  // 渲染搜索结果
  const renderSearchResults = () => {
    if (searchLoading) {
      return (
        <div className={styles.loadingState}>
          <p className={styles.loadingStateText}>{t('allCourses.states.loading')}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateText}>
            {error === 'Network error' 
              ? t('allCourses.states.networkError')
              : error === 'Failed to load courses'
              ? t('allCourses.states.loadFailed')
              : error}
          </p>
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
        {searchResults.map((resource) => {
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
        })}
      </div>
    );
  };

  // 按课程名称排序
  const coursesByName = [...courses].sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  // 按开课院系分组并排序
  const coursesByDept = courses.reduce((acc, course) => {
    const dept = course.dept || t('allCourses.uncategorized');
    if (!acc[dept]) {
      acc[dept] = [];
    }
    acc[dept].push(course);
    return acc;
  }, {} as Record<string, Course[]>);

  // 对每个院系的课程按名称排序
  Object.keys(coursesByDept).forEach(dept => {
    coursesByDept[dept].sort((a, b) => a.name.localeCompare(b.name));
  });

  // 按院系名称排序
  const sortedDepts = Object.keys(coursesByDept).sort();

  const renderCoursesByName = () => {
    if (loading) {
      return (
        <div className={styles.loadingState}>
          <p className={styles.loadingStateText}>{t('allCourses.states.loading')}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateText}>
            {error === 'Network error' 
              ? t('allCourses.states.networkError')
              : error === 'Failed to load courses'
              ? t('allCourses.states.loadFailed')
              : error}
          </p>
        </div>
      );
    }

    if (coursesByName.length === 0) {
      return (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateText}>{t('allCourses.states.noCourses')}</p>
        </div>
      );
    }

    return (
      <div className={styles.courseList}>
        {coursesByName.map((course) => (
          <div
            key={course.id}
            className={styles.courseCard}
          >
            <div className={styles.courseCardContent}>
              <div className={styles.courseName}>{course.name}</div>
              {course.dept && (
                <div className={styles.courseDept}>{course.dept}</div>
              )}
            </div>
            <div className={styles.courseCardActions}>
              <Tooltip title={t('allCourses.course.viewReviews')}>
                <button
                  type="button"
                  className={styles.reviewButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCourse(course);
                    setReviewsModalOpen(true);
                  }}
                >
                  <svg
                    className={styles.reviewIcon}
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
              <Tooltip title={t('allCourses.course.viewResources')}>
                <button
                  type="button"
                  className={styles.viewResourcesButton}
                  onClick={() => {
                    setSelectedCourse(course);
                    setResourcesModalOpen(true);
                  }}
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
        ))}
      </div>
    );
  };

  const renderCoursesByDept = () => {
    if (loading) {
      return (
        <div className={styles.loadingState}>
          <p className={styles.loadingStateText}>{t('allCourses.states.loading')}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateText}>
            {error === 'Network error' 
              ? t('allCourses.states.networkError')
              : error === 'Failed to load courses'
              ? t('allCourses.states.loadFailed')
              : error}
          </p>
        </div>
      );
    }

    if (sortedDepts.length === 0) {
      return (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateText}>{t('allCourses.states.noCourses')}</p>
        </div>
      );
    }

    const toggleDept = (dept: string) => {
      setExpandedDepts(prev => {
        const newSet = new Set(prev);
        if (newSet.has(dept)) {
          newSet.delete(dept);
        } else {
          newSet.add(dept);
        }
        return newSet;
      });
    };

    return (
      <div>
        {sortedDepts.map((dept) => {
          const isExpanded = expandedDepts.has(dept);
          return (
            <div key={dept} className={styles.deptSection}>
              <div className={styles.deptHeader}>
                <div className={styles.deptHeaderContent}>
                  <h3 className={styles.deptTitle}>{dept}</h3>
                  <span className={styles.courseCount}>({coursesByDept[dept].length})</span>
                </div>
                <button
                  type="button"
                  className={styles.expandButton}
                  onClick={() => toggleDept(dept)}
                >
                  <svg
                    className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}
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
              </div>
              {isExpanded && (
                <div className={styles.courseList}>
                  {coursesByDept[dept].map((course) => (
                    <div
                      key={course.id}
                      className={styles.courseCard}
                    >
                      <div className={styles.courseCardContent}>
                        <div className={styles.courseName}>{course.name}</div>
                        {course.dept && (
                          <div className={styles.courseDept}>{course.dept}</div>
                        )}
                      </div>
                      <div className={styles.courseCardActions}>
                        <Tooltip title={t('allCourses.course.viewReviews')}>
                          <button
                            type="button"
                            className={styles.reviewButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCourse(course);
                              setReviewsModalOpen(true);
                            }}
                          >
                            <svg
                              className={styles.reviewIcon}
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
                        <Tooltip title={t('allCourses.course.viewResources')}>
                          <button
                            type="button"
                            className={styles.viewResourcesButton}
                            onClick={() => {
                              setSelectedCourse(course);
                              setResourcesModalOpen(true);
                            }}
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
                  ))}
                </div>
              )}
            </div>
          );
        })}
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
                  placeholder={t('allCourses.search.resourcePlaceholder')}
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
            <div className={styles.header}>
              <h1 className={styles.mainTitle}>{t('allCourses.title')}</h1>
              <p className={styles.subTitle}>{t('allCourses.subtitle')}</p>
            </div>
          )}

          {!hasSearched && (
            <div className={styles.tabs} role="tablist" aria-label={t('allCourses.tabs.ariaLabel')}>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'name'}
                className={`${styles.tab} ${activeTab === 'name' ? styles.active : ''}`}
                onClick={() => setActiveTab('name')}
              >
                {t('allCourses.tabs.name')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'dept'}
                className={`${styles.tab} ${activeTab === 'dept' ? styles.active : ''}`}
                onClick={() => setActiveTab('dept')}
              >
                {t('allCourses.tabs.dept')}
              </button>
            </div>
          )}

          <section className={`${styles.tabPanel} ${hasSearched ? styles.searchResultsPanel : ''}`} role="tabpanel">
            {hasSearched ? (
              renderSearchResults()
            ) : (
              <>
                {activeTab === 'name' && renderCoursesByName()}
                {activeTab === 'dept' && renderCoursesByDept()}
              </>
            )}
          </section>
        </div>
      </main>
      <AddResourceModal
        open={addResourceModalOpen}
        onClose={() => setAddResourceModalOpen(false)}
        onSuccess={() => {
          // 可以在这里刷新数据或显示成功消息
        }}
      />
      {selectedCourse && (
        <>
          <CourseResourcesModal
            open={resourcesModalOpen}
            onClose={() => {
              setResourcesModalOpen(false);
              setSelectedCourse(null);
            }}
            courseId={selectedCourse.id}
            courseName={selectedCourse.name}
          />
          <CourseReviewsModal
            open={reviewsModalOpen}
            onClose={() => {
              setReviewsModalOpen(false);
              setSelectedCourse(null);
            }}
            courseId={selectedCourse.id}
            courseName={selectedCourse.name}
            courseDept={selectedCourse.dept}
          />
        </>
      )}
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
    </ProtectedRoute>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'zh', ['common'])),
  },
});
