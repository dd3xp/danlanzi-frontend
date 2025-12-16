import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Upload, Button, message, Tag } from 'antd';
import { showToast } from '@/components/global/Toast';
import type { UploadProps } from 'antd';
import { PlusOutlined, UploadOutlined, CloseOutlined } from '@ant-design/icons';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { uploadResource, updateResource, ResourceType, Resource } from '@/services/resourceService';
import { getCourses, createCourse, getOfferings } from '@/services/courseService';
import { getAuthHeaders } from '@/utils/auth';
import backendUrl from '@/services/backendUrl';
import { getDepartments, getTermOptions } from '@/utils/academicOptions';
import { translateApiMessage } from '@/utils/translator';
import { TAG_PREFIXES } from '@/utils/resourceUtils';
import styles from '@/styles/resources/AddResourceModal.module.css';

const { TextArea } = Input;
const { Option } = Select;

interface AddResourceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: Resource | null; // 编辑模式时传入的资源数据
}

export default function AddResourceModal({ open, onClose, onSuccess, initialData }: AddResourceModalProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const locale = router.locale || 'zh';

  const [loading, setLoading] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [department, setDepartment] = useState('');
  const [term, setTerm] = useState('');
  const [instructors, setInstructors] = useState<string[]>(['']);
  const [description, setDescription] = useState('');
  const [resourceName, setResourceName] = useState('');
  const [fileList, setFileList] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>(['']);
  const [courseCodeTag, setCourseCodeTag] = useState('');
  const departments = getDepartments(locale, t);
  const termOptions = getTermOptions();

  // 从 initialData 加载数据到表单（编辑模式）
  useEffect(() => {
    console.log('AddResourceModal useEffect triggered', { 
      open, 
      hasInitialData: !!initialData,
      initialDataId: initialData?.id,
      initialDataTitle: initialData?.title,
      initialDataDescription: initialData?.description,
      initialDataTags: initialData?.tags
    });
    
    if (open && initialData) {
      // 编辑模式：加载资源数据
      console.log('Loading resource data into form', initialData);
      setResourceName(initialData.title || '');
      setDescription(initialData.description || '');
      
      // 解析标签和课程信息
      const { parseResourceTags } = require('@/utils/resourceUtils');
      const parsed = parseResourceTags(initialData);
      
      console.log('Parsed tags', parsed);
      
      if (parsed.term.length > 0) {
        setTerm(parsed.term[0]);
      } else {
        setTerm('');
      }
      if (parsed.courseName.length > 0) {
        setCourseName(parsed.courseName[0]);
      } else {
        setCourseName('');
      }
      if (parsed.courseCode.length > 0) {
        setCourseCodeTag(parsed.courseCode[0]);
      } else {
        setCourseCodeTag('');
      }
      if (parsed.instructors.length > 0) {
        setInstructors(parsed.instructors);
      } else {
        setInstructors(['']);
      }
      if (parsed.others.length > 0) {
        setTags(parsed.others);
      } else {
        setTags(['']);
      }
      
      // 如果有课程关联，设置部门
      if (initialData.courseLinks && initialData.courseLinks.length > 0) {
        const course = initialData.courseLinks[0]?.offering?.course;
        if (course?.dept) {
          setDepartment(course.dept);
        } else {
          setDepartment('');
        }
      } else {
        setDepartment('');
      }
      
      // 文件类型资源不需要设置文件列表（编辑时不能重新上传文件，除非用户选择新文件）
      setFileList([]);
    } else if (open && !initialData) {
      // 新建模式：重置表单
      console.log('Resetting form for new resource');
      resetForm();
    }
  }, [open, initialData?.id, initialData?.title, initialData?.description, initialData?.tags, initialData?.courseLinks]);

  // 重置表单
  const resetForm = () => {
    setCourseName('');
    setDepartment('');
    setTerm('');
    setInstructors(['']);
    setDescription('');
    setResourceName('');
    setFileList([]);
    setTags(['']);
    setCourseCodeTag('');
  };

  // 处理关闭
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 添加教师
  const addInstructor = () => {
    setInstructors([...instructors, '']);
  };

  // 删除教师
  const removeInstructor = (index: number) => {
    if (instructors.length > 1) {
      setInstructors(instructors.filter((_, i) => i !== index));
    }
  };

  // 更新教师
  const updateInstructor = (index: number, value: string) => {
    const newInstructors = [...instructors];
    newInstructors[index] = value;
    setInstructors(newInstructors);
  };

  // 添加标签
  const addTag = () => {
    setTags([...tags, '']);
  };

  // 删除标签
  const removeTag = (index: number) => {
    if (tags.length > 1) {
      setTags(tags.filter((_, i) => i !== index));
    }
  };

  // 更新标签
  const updateTag = (index: number, value: string) => {
    const newTags = [...tags];
    newTags[index] = value;
    setTags(newTags);
  };

  // 文件上传配置
  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      const isLt20M = file.size / 1024 / 1024 < 20;
      if (!isLt20M) {
        message.error(t('allCourses.resource.fileTooLarge'));
        return Upload.LIST_IGNORE;
      }
      // 保存文件对象，确保可以访问
      const fileObj = {
        uid: file.uid || `file-${Date.now()}`,
        name: file.name,
        status: 'done' as const,
        originFileObj: file,
      };
      setFileList([fileObj]);
      console.log('File selected:', file.name, file.size);
      return Upload.LIST_IGNORE; // 阻止自动上传
    },
    onRemove: () => {
      setFileList([]);
    },
    fileList,
    maxCount: 1,
    accept: '*', // 接受所有文件类型
    showUploadList: {
      showPreviewIcon: false,
      showRemoveIcon: true,
      showDownloadIcon: false,
    },
  };

  // 获取或创建课程
  const getOrCreateCourse = async (name: string, dept?: string): Promise<number | null> => {
    if (!name.trim()) {
      return null;
    }

    // 先搜索是否存在（通过课程名称）
    const searchResponse = await getCourses({
      page: 1,
      limit: 10,
      search: name.trim(),
    });

    if (searchResponse.status === 'success' && searchResponse.data && searchResponse.data.courses.length > 0) {
      // 精确匹配课程名称
      const exactMatch = searchResponse.data.courses.find(c => c.name === name.trim());
      if (exactMatch) {
        return exactMatch.id;
      }
    }

    // 如果不存在，创建新课程
    const createResponse = await createCourse({
      code: `AUTO_${Date.now()}`, // 自动生成代码
      name: name.trim(),
      dept: dept || undefined,
    });

    if (createResponse.status === 'success' && createResponse.data) {
      return createResponse.data.course.id;
    }

    return null;
  };

  // 获取或创建开课实例
  const getOrCreateOffering = async (courseId: number, term: string, instructors?: string[]): Promise<number | null> => {
    if (!term) {
      return null;
    }

    // 先查找是否存在
    const offeringsResponse = await getOfferings({
      course_id: courseId,
      term: term,
    });

    if (offeringsResponse.status === 'success' && offeringsResponse.data && offeringsResponse.data.offerings.length > 0) {
      // 如果找到了，返回第一个
      return offeringsResponse.data.offerings[0].id;
    }

    // 如果不存在，创建新的开课实例
    const API_BASE_URL = `${backendUrl}/api`;
    const headers = getAuthHeaders();
    headers['Content-Type'] = 'application/json';

    try {
      const response = await fetch(`${API_BASE_URL}/course/offerings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          course_id: courseId,
          term: term,
          instructor: instructors && instructors.length > 0 ? instructors : undefined,
        }),
      });

      const data = await response.json();
      if (response.ok && data.status === 'success' && data.data?.offering) {
        return data.data.offering.id;
      }
    } catch (error) {
      console.error('Failed to create offering:', error);
    }

    return null;
  };

  // 提交表单
  const handleSubmit = async () => {
    // 验证必填字段
    if (!courseName.trim()) {
      message.error(t('allCourses.resource.courseNameRequired'));
      return;
    }

    if (!department) {
      message.error(t('allCourses.resource.departmentRequired'));
      return;
    }

    if (!term) {
      message.error(t('allCourses.resource.termRequired'));
      return;
    }

    if (!resourceName.trim()) {
      message.error(t('allCourses.resource.resourceNameRequired'));
      return;
    }

    if (!description.trim()) {
      message.error(t('allCourses.resource.descriptionRequired'));
      return;
    }

    // 附件是可选的，如果有文件则验证
    let file: File | null = null;
    if (fileList.length > 0) {
      const fileObj = fileList[0]?.originFileObj || fileList[0];
      if (fileObj && fileObj instanceof File) {
        file = fileObj;
      } else {
        console.error('Invalid file object:', fileObj);
        message.error(t('allCourses.resource.fileInvalid'));
        return;
      }
    }

    const validInstructors = instructors.filter(i => i.trim());
    const validTags = tags.filter(tag => tag.trim());
    
    // 如果有课程代码tag，添加到tags中
    const allTags = [...validTags];
    if (courseCodeTag.trim()) {
      // 使用中文前缀（与数据库中已存储的格式保持一致）
      allTags.push(`${TAG_PREFIXES.COURSE_CODE_ZH}${courseCodeTag.trim()}`);
    }
    
    // 不再将老师添加到tags中，因为老师信息已经通过offering关联
    // 老师信息会从offering.instructor中获取并显示

    setLoading(true);
    try {
      let courseId: number | null = null;
      let offeringId: number | null = null;
      
      // 如果填写了课程名称，获取或创建课程
      if (courseName.trim()) {
        courseId = await getOrCreateCourse(courseName.trim(), department);
        
        if (!courseId) {
          message.error(t('allCourses.resource.createCourseFailed'));
          setLoading(false);
          return;
        }

        // 如果填写了学期，获取或创建开课实例
        if (term && courseId) {
          offeringId = await getOrCreateOffering(courseId, term, validInstructors.length > 0 ? validInstructors : undefined);
        }
      }

      if (initialData) {
        // 编辑模式
        console.log('Updating resource', { 
          id: initialData.id,
          courseName, 
          courseId,
          term,
          offeringId,
          resourceName,
          description: description.trim(),
          fileName: file ? file.name : 'no file',
          tags: allTags
        });

        const response = await updateResource(initialData.id, {
          type: file ? 'file' : (initialData.type || 'note'),
          title: resourceName.trim(),
          description: description.trim(),
          visibility: initialData.visibility || 'public',
          course_id: courseId || undefined,
          offering_id: offeringId || undefined,
          file: file || undefined,
          tags: allTags.length > 0 ? allTags : undefined,
        });

        console.log('Update response', response);

        if (response.status === 'success') {
          showToast(t('myResources.updateSuccess'), 'success');
          handleClose();
          onSuccess?.();
        } else {
          console.error('Update failed:', response);
          message.error(translateApiMessage(response, t));
        }
      } else {
        // 新建模式
        console.log('Uploading resource', { 
          courseName, 
          courseId,
          term,
          offeringId,
          resourceName,
          fileName: file ? file.name : 'no file',
          fileSize: file ? file.size : 0,
          fileType: file ? file.type : 'note',
          tags: allTags
        });

        const response = await uploadResource({
          type: file ? 'file' : 'note',
          title: resourceName.trim(),
          description: description.trim() || undefined,
          visibility: 'public',
          course_id: courseId || undefined,
          offering_id: offeringId || undefined,
          file: file || undefined,
          tags: allTags.length > 0 ? allTags : undefined,
        });

        console.log('Upload response', response);

        if (response.status === 'success') {
          showToast(t('allCourses.resource.uploadSuccess'), 'success');
          handleClose();
          onSuccess?.();
        } else {
          console.error('Upload failed:', response);
          message.error(translateApiMessage(response, t));
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error(t('allCourses.resource.uploadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 上传组件的配置（使用Dragger，完全照搬上传头像页面的配置）
  const draggerProps: UploadProps = {
    ...uploadProps,
    listType: 'picture',
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      title={initialData ? t('myResources.editResource') : t('allCourses.resource.addResource')}
      width={1000}
      className={styles.modal}
      style={{ top: '5%' }}
      key={initialData?.id || 'new'}
    >
      <div className={styles.formLayout}>
        {/* 左侧：基本信息 */}
        <div className={styles.leftPanel}>
          <div className={styles.form}>
            {/* 课程名称 - 必填 */}
            <div className={styles.formItem}>
              <label className={styles.label}>
                {t('allCourses.resource.courseName')} <span className={styles.required}>*</span>
              </label>
              <div className={styles.fieldControl}>
                <svg className={styles.fieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <input
                  className={styles.nameInput}
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder={t('allCourses.resource.courseNamePlaceholder')}
                />
              </div>
            </div>

            {/* 开课院系 - 必填 */}
            <div className={styles.formItem}>
              <label className={styles.label}>
                {t('allCourses.resource.department')} <span className={styles.required}>*</span>
              </label>
              <div className={styles.fieldControl}>
                <svg className={styles.fieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div className={styles.profileSelectWrapper}>
                  <Select
                    value={department || undefined}
                    onChange={setDepartment}
                    placeholder={t('allCourses.resource.departmentPlaceholder')}
                    options={departments}
                    showSearch={false}
                    popupMatchSelectWidth
                    listHeight={200}
                  />
                </div>
              </div>
            </div>

            {/* 开课学期 - 必填 */}
            <div className={styles.formItem}>
              <label className={styles.label}>
                {t('allCourses.resource.term')} <span className={styles.required}>*</span>
              </label>
              <div className={styles.fieldControl}>
                <svg className={styles.fieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <div className={styles.profileSelectWrapper}>
                  <Select
                    value={term || undefined}
                    onChange={setTerm}
                    placeholder={t('allCourses.resource.termPlaceholder')}
                    options={termOptions}
                    showSearch={false}
                    popupMatchSelectWidth
                    listHeight={200}
                  />
                </div>
              </div>
            </div>

            {/* 课程代码（特殊tag）- 选填 */}
            <div className={styles.formItem}>
              <label className={styles.label}>
                {t('allCourses.resource.courseCode')} <span className={styles.optional}>({t('allCourses.resource.optional')})</span>
              </label>
              <div className={styles.fieldControl}>
                <svg className={styles.fieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="14" rx="2" />
                  <path d="M3 8h18" />
                </svg>
                <input
                  className={styles.nameInput}
                  value={courseCodeTag}
                  onChange={(e) => setCourseCodeTag(e.target.value)}
                  placeholder={t('allCourses.resource.courseCodePlaceholder')}
                />
              </div>
            </div>

            {/* 任课老师 - 选填 */}
            <div className={styles.formItem}>
              <label className={styles.label}>
                {t('allCourses.resource.instructors')} <span className={styles.optional}>({t('allCourses.resource.optional')})</span>
              </label>
              {instructors.map((instructor, index) => (
                <div key={index} className={styles.multiInputWrapper}>
                  <div className={styles.fieldControl}>
                    <svg className={styles.fieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <input
                      className={styles.nameInput}
                      value={instructor}
                      onChange={(e) => updateInstructor(index, e.target.value)}
                      placeholder={t('allCourses.resource.instructorPlaceholder')}
                    />
                    {index === instructors.length - 1 ? (
                      <button
                        type="button"
                        className={styles.addInlineButton}
                        onClick={addInstructor}
                        title={t('allCourses.resource.addInstructor')}
                      >
                        <PlusOutlined />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => removeInstructor(index)}
                      >
                        <CloseOutlined />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 标签 - 选填 */}
            <div className={styles.formItem}>
              <label className={styles.label}>
                {t('allCourses.resource.tags')} <span className={styles.optional}>({t('allCourses.resource.optional')})</span>
              </label>
              {tags.map((tag, index) => (
                <div key={index} className={styles.multiInputWrapper}>
                  <div className={styles.fieldControl}>
                    <svg className={styles.fieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                    <input
                      className={styles.nameInput}
                      value={tag}
                      onChange={(e) => updateTag(index, e.target.value)}
                      placeholder={t('allCourses.resource.tagPlaceholder')}
                    />
                    {index === tags.length - 1 ? (
                      <button
                        type="button"
                        className={styles.addInlineButton}
                        onClick={addTag}
                        title={t('allCourses.resource.addTag')}
                      >
                        <PlusOutlined />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => removeTag(index)}
                      >
                        <CloseOutlined />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧：描述和上传 */}
        <div className={styles.rightPanel}>
          {/* 资源名称 - 必填 */}
          <div className={styles.rightSection}>
            <label className={styles.label}>
              {t('allCourses.resource.resourceName')} <span className={styles.required}>*</span>
            </label>
            <div className={styles.fieldControl}>
              <svg className={styles.fieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10,9 9,9 8,9" />
              </svg>
              <input
                className={styles.nameInput}
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                placeholder={t('allCourses.resource.resourceNamePlaceholder')}
              />
            </div>
          </div>

          {/* 资源描述 - 必填 */}
          <div className={styles.rightSection}>
            <label className={styles.label}>
              {t('allCourses.resource.description')} <span className={styles.required}>*</span>
            </label>
            <div className={`${styles.fieldControl} ${styles.descriptionFieldControl}`}>
              <svg className={styles.fieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10,9 9,9 8,9" />
              </svg>
              <textarea
                className={styles.bioInput}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('allCourses.resource.descriptionPlaceholder')}
                rows={8}
              />
            </div>
          </div>

          {/* 上传附件 */}
          <div className={styles.rightSection}>
            <label className={styles.label}>
              {t('allCourses.resource.file')} <span className={styles.optional}>({t('allCourses.resource.optional')})</span>
            </label>
            <div className={styles.uploadDragger}>
              <Upload.Dragger {...draggerProps} className={styles.dragger}>
                <div className={styles.dragInner}>
                  <div className={styles.uploadIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p className={styles.dragTitle}>{t('allCourses.resource.uploadFile')}</p>
                  <p className={styles.dragDesc}>{t('allCourses.resource.fileHint')}</p>
                </div>
              </Upload.Dragger>
            </div>
            {fileList.length > 0 && (
              <div className={styles.fileListContainer}>
                <div className={styles.fileListItem}>
                  <svg className={styles.fileIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <div className={styles.fileInfo}>
                    <div className={styles.fileName}>{fileList[0].name}</div>
                    <div className={styles.fileSize}>
                      {(() => {
                        const file = fileList[0].originFileObj || fileList[0];
                        const size = file?.size;
                        if (size) {
                          if (size < 1024) {
                            return `${size} B`;
                          } else if (size < 1024 * 1024) {
                            return `${(size / 1024).toFixed(2)} KB`;
                          } else {
                            return `${(size / 1024 / 1024).toFixed(2)} MB`;
                          }
                        }
                        return '';
                      })()}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.removeFileButton}
                    onClick={() => {
                      setFileList([]);
                    }}
                    title={t('allCourses.resource.removeFile')}
                  >
                    <CloseOutlined />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={styles.actionButtons}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={handleClose}
          disabled={loading}
        >
          {t('allCourses.resource.cancel')}
        </button>
        <button
          type="button"
          className={styles.confirmButton}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <span className={styles.loadingDots}>
              <span></span><span></span><span></span>
            </span>
          ) : (
            initialData ? t('myResources.update') : t('allCourses.resource.submit')
          )}
        </button>
      </div>
    </Modal>
  );
}

