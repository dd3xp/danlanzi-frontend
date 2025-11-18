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

type TabType = 'name' | 'dept';

const SEARCH_HISTORY_KEY = 'course_search_history';
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
    setIsSearching(true);
    setLoading(true);
    setError(null);
    
    try {
      const response = await getCourses({
        page: 1,
        limit: 100,
        search: query.trim() || undefined,
      });
      
      if (response.status === 'success' && response.data) {
        setCourses(response.data.courses);
        if (query.trim()) {
          saveSearchHistory(query);
        }
      } else {
        setError(response.message || t('allCourses.states.loadFailed'));
      }
    } catch (err) {
      setError(t('allCourses.states.networkError'));
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  // 初始加载课程
  useEffect(() => {
    performSearch('');
  }, []);

  // 处理搜索输入
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowHistory(value === '');
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
                  placeholder={t('allCourses.search.placeholder')}
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

          <div className={styles.header}>
            <h1 className={styles.mainTitle}>{t('allCourses.title')}</h1>
            <p className={styles.subTitle}>{t('allCourses.subtitle')}</p>
          </div>

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

          <section className={styles.tabPanel} role="tabpanel">
            {activeTab === 'name' && renderCoursesByName()}
            {activeTab === 'dept' && renderCoursesByDept()}
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
    </ProtectedRoute>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'zh', ['common'])),
  },
});
