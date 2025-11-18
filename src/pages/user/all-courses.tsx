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
import styles from '@/styles/all-courses/AllCourses.module.css';
import { getCourses, Course } from '@/services/courseService';
import { getResources, Resource, favoriteResource, unfavoriteResource } from '@/services/resourceService';
import ResourceDetailModal from '@/components/resources/ResourceDetailModal';

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
          // 从API响应中获取收藏状态
          const favoritedIds = new Set(
            response.data.resources
              .filter((r: Resource) => r.isFavorited)
              .map((r: Resource) => r.id)
          );
          setFavoritedResources(favoritedIds);
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

  // 解析资源tags
  const parseResourceTags = (resource: Resource) => {
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
            return newSet;
          });
        } else {
          setFavoritedResources(prev => new Set(prev).add(resourceId));
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
          <p className={styles.emptyStateText}>{t('allCourses.search.noResults') || '未找到相关资源'}</p>
        </div>
      );
    }

    if (searchResults.length === 0) {
      return null;
    }

    return (
      <div className={styles.resourcesList}>
        {searchResults.map((resource) => {
          const { term, courseCode, instructors, others } = parseResourceTags(resource);
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
          <button
            key={course.id}
            type="button"
            className={styles.courseCardButton}
            onClick={() => {
              setSelectedCourse(course);
              setResourcesModalOpen(true);
            }}
          >
            <div className={styles.courseCardContent}>
              <div className={styles.courseName}>{course.name}</div>
              {course.dept && (
                <div className={styles.courseDept}>{course.dept}</div>
              )}
            </div>
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
              <button
                type="button"
                className={styles.deptHeader}
                onClick={() => toggleDept(dept)}
              >
                <div className={styles.deptHeaderContent}>
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
                  <h3 className={styles.deptTitle}>{dept}</h3>
                  <span className={styles.courseCount}>({coursesByDept[dept].length})</span>
                </div>
              </button>
              {isExpanded && (
                <div className={styles.courseList}>
                  {coursesByDept[dept].map((course) => (
                    <button
                      key={course.id}
                      type="button"
                      className={styles.courseCardButton}
                      onClick={() => {
                        setSelectedCourse(course);
                        setResourcesModalOpen(true);
                      }}
                    >
                      <div className={styles.courseCardContent}>
                        <div className={styles.courseName}>{course.name}</div>
                        {course.dept && (
                          <div className={styles.courseDept}>{course.dept}</div>
                        )}
                      </div>
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
                  placeholder={t('allCourses.search.resourcePlaceholder') || '搜索资源名称、标签、课程、老师...'}
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
        <CourseResourcesModal
          open={resourcesModalOpen}
          onClose={() => {
            setResourcesModalOpen(false);
            setSelectedCourse(null);
          }}
          courseId={selectedCourse.id}
          courseName={selectedCourse.name}
        />
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
