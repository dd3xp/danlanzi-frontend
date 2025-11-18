import React, { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { Resource } from '@/services/resourceService';
import { getAuthHeaders } from '@/utils/auth';
import backendUrl from '@/services/backendUrl';
import { getUserAvatar } from '@/services/userAvatarService';
import styles from '@/styles/resources/ResourceDetailModal.module.css';

interface ResourceDetailModalProps {
  open: boolean;
  onClose: () => void;
  resource: Resource | null;
  courseName?: string;
}

export default function ResourceDetailModal({ open, onClose, resource, courseName }: ResourceDetailModalProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [uploaderAvatar, setUploaderAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (open && resource?.uploader?.id) {
      loadUploaderAvatar();
    } else {
      setUploaderAvatar(null);
    }
  }, [open, resource?.uploader?.id]);

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
      others: otherTags,
      courseNameFromApi,
      courseDept
    };
  };

  const { term, courseCode, instructors, others, courseNameFromApi, courseDept } = parseTags();
  
  // 优先使用API返回的课程名称，如果没有则使用props传入的
  const displayCourseName = courseNameFromApi || courseName;

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
      </div>
    </Modal>
  );
}

