import React, { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { useTranslation } from 'next-i18next';
import { getResources, Resource } from '@/services/resourceService';
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

  useEffect(() => {
    if (open && courseId) {
      loadResources();
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
      }
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setLoading(false);
    }
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
                  return (
                    <div key={resource.id} className={styles.resourceCard}>
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
                  );
                })
        )}
      </div>
    </Modal>
  );
}

