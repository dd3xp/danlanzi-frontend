import React, { useState } from 'react';
import { Select } from 'antd';
import Image from 'next/image';
import Tooltip from '@/components/global/Tooltip';
import AvatarUploadModal from '@/components/profile/AvatarUploadModal';
import SystemAvatarModal from '@/components/profile/SystemAvatarModal';
import { useTranslation } from 'next-i18next';
import styles from '@/styles/profile/ProfileCard.module.css';
import { updateUserProfile } from '@/services/userProfileService';
import { getUserAvatar } from '@/services/userAvatarService';
import { eventBus, EVENTS } from '@/utils/eventBus';
import { getDepartments, getAvailableMajors } from '@/utils/academicOptions';

interface ProfileCardProps {
  user: any;
  onUserUpdate: (user: any) => void;
}

export default function ProfileCard({ user, onUserUpdate }: ProfileCardProps) {
  const { t } = useTranslation('common');
  const { t: tAcademic } = useTranslation('academic');
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.nickname || '');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showStudentId, setShowStudentId] = useState(user?.show_student_id ?? true);
  const [showDepartment, setShowDepartment] = useState(user?.show_department ?? true);
  const [showMajor, setShowMajor] = useState(user?.show_major ?? true);
  const [showBio, setShowBio] = useState(user?.show_bio ?? true);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [systemAvatarModalOpen, setSystemAvatarModalOpen] = useState(false);
  
  // 新增字段状态
  const [departmentInput, setDepartmentInput] = useState(user?.department || '');
  const [majorInput, setMajorInput] = useState(user?.major || '');
  const [bioInput, setBioInput] = useState(user?.bio || '');

  const handleAvatarUploadClick = () => {
    setAvatarModalOpen(true);
  };

  const handleAvatarUploaded = async () => {
    // 获取新的头像数据
    const avatarRes = await getUserAvatar(user.id);
    if (avatarRes.status === 'success' && avatarRes.avatar_data_url) {
      onUserUpdate({
        ...user,
        avatar_data_url: avatarRes.avatar_data_url
      });
    }
    
    // 通知其他组件头像已更新
    eventBus.emit(EVENTS.AVATAR_UPDATED);
    setAvatarModalOpen(false);
  };

  // 从 academicOptions 获取选项数据
  const departments = getDepartments(t);
  const availableMajors = getAvailableMajors(t, departmentInput);

  // 院系变化时重置专业选择
  const handleDepartmentChange = (newDepartment: string) => {
    setDepartmentInput(newDepartment);
    setMajorInput(''); // 重置专业选择
  };

  return (
    <div className={styles.heroCard}>
      {!editing ? (
        <Tooltip title={t('profile.actions.edit')}>
          <button
            type="button"
            className={styles.cardAction}
            aria-label={t('profile.actions.edit')}
            onClick={() => setEditing(true)}
          >
            {/* edit (pencil) */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.cardActionIcon}>
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
          </button>
        </Tooltip>
      ) : (
        <div className={styles.cardActionGroup}>
          <Tooltip title={t('profile.actions.save')}>
            <button
              type="button"
              className={styles.cardAction}
              aria-label={t('profile.actions.save')}
              onClick={async () => {
                // 保存用户资料
                try {
                  setIsRefreshing(true);
                  const res = await updateUserProfile({
                    nickname: nameInput,
                    department: departmentInput,
                    major: majorInput,
                    bio: bioInput,
                    show_student_id: showStudentId,
                    show_department: showDepartment,
                    show_major: showMajor,
                    show_bio: showBio
                  });
                  if (res.status === 'success' && res.user) {
                    const profile = res.user;
                    
                    // 获取用户头像
                    const avatarRes = await getUserAvatar(profile.id);
                    if (avatarRes.status === 'success' && avatarRes.avatar_data_url) {
                      profile.avatar_data_url = avatarRes.avatar_data_url;
                    }
                    
                    onUserUpdate(profile);
                    setNameInput(profile?.nickname || '');
                    setDepartmentInput(profile?.department || '');
                    setMajorInput(profile?.major || '');
                    setBioInput(profile?.bio || '');
                    setShowStudentId(profile?.show_student_id ?? true);
                    setShowDepartment(profile?.show_department ?? true);
                    setShowMajor(profile?.show_major ?? true);
                    setShowBio(profile?.show_bio ?? true);
                  }
                } catch (e) {
                  // 忽略错误，后续可加错误提示
                } finally {
                  setIsRefreshing(false);
                  setEditing(false);
                }
              }}
            >
              {/* save (check) */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.cardActionIcon}>
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </button>
          </Tooltip>
          <Tooltip title={t('profile.actions.discard')}>
            <button
              type="button"
              className={styles.cardAction}
              aria-label={t('profile.actions.discard')}
              onClick={() => {
                setNameInput(user?.nickname || '');
                setDepartmentInput(user?.department || '');
                setMajorInput(user?.major || '');
                setBioInput(user?.bio || '');
                setShowStudentId(user?.show_student_id ?? true);
                setShowDepartment(user?.show_department ?? true);
                setShowMajor(user?.show_major ?? true);
                setShowBio(user?.show_bio ?? true);
                setEditing(false);
              }}
            >
              {/* discard (x) */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.cardActionIcon}>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </Tooltip>
        </div>
      )}
      <div className={styles.heroLeft}>
        <div className={styles.heroAvatarRing}>
          <div className={styles.heroAvatarWrap}>
            {user?.avatar_data_url ? (
              <Image
                src={user.avatar_data_url}
                alt={t('avatar.alt')}
                fill
                className={styles.heroAvatar}
              />
            ) : (
              <div className={styles.heroAvatarFallback}>
                {(user?.nickname?.[0] || 'U').toUpperCase()}
              </div>
            )}
            {editing && (
              <div className={styles.avatarEditOverlay}>
                <Tooltip title={t('profile.actions.upload')}>
                  <button type="button" className={styles.avatarEditAction} aria-label={t('profile.actions.upload')} onClick={handleAvatarUploadClick}>
                    {/* plus icon */}
                    <svg className={styles.avatarEditIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </Tooltip>
                <Tooltip title={t('profile.actions.gallery')}>
                  <button 
                    type="button" 
                    className={styles.avatarEditAction} 
                    aria-label={t('profile.actions.gallery')}
                    onClick={() => setSystemAvatarModalOpen(true)}
                  >
                    {/* gallery icon */}
                    <svg className={styles.avatarEditIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="14" rx="2" />
                      <circle cx="8.5" cy="9.5" r="1.5" />
                      <path d="M21 14l-4.5-4.5L12 14l-2.5-2.5L3 18" />
                    </svg>
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={styles.heroBody}>
        {!editing ? (
          <>
            <div className={styles.nameContainer}>
              <h1 className={styles.displayName}>{user?.nickname || 'User'}</h1>
            </div>
            <div className={styles.infoContainer}>
              {user?.student_id && showStudentId && (
                <div className={styles.infoItem}>
                  <div className={`${styles.infoIcon} ${styles.studentId}`}></div>
                  <span className={styles.infoText}>{user.student_id}</span>
                </div>
              )}
              {departmentInput && showDepartment && (
                <div className={styles.infoItem}>
                  <div className={`${styles.infoIcon} ${styles.department}`}></div>
                  <span className={styles.infoText}>{departments.find(d => d.value === departmentInput)?.label || departmentInput}</span>
                </div>
              )}
              {majorInput && showMajor && (
                <div className={styles.infoItem}>
                  <div className={`${styles.infoIcon} ${styles.major}`}></div>
                  <span className={styles.infoText}>{getAvailableMajors(t, departmentInput).find(m => m.value === majorInput)?.label || majorInput}</span>
                </div>
              )}
              {bioInput && showBio && (
                <div className={styles.infoItem}>
                  <div className={`${styles.infoIcon} ${styles.bio}`}></div>
                  <span className={styles.infoText}>{bioInput}</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.editGroup}>
            <div>
              <div className={styles.fieldLabel}>{t('profile.fields.nickname')}</div>
              <div className={styles.fieldControl}>
                {/* nickname icon */}
                <svg className={styles.fieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="7" r="4" />
                  <path d="M6 21c0-3.314 2.686-6 6-6s6 2.686 6 6" />
                </svg>
                <input
                  className={styles.nameInput}
                  value={nameInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    // 计算长度：中文字符算2个单位，其他字符算1个单位
                    const lengthUnits = Array.from(val).reduce((sum, ch) => 
                      sum + (/[\u4e00-\u9fa5]/.test(ch) ? 2 : 1), 0
                    );
                    // 限制总长度不超过20个单位
                    if (lengthUnits <= 20) {
                      setNameInput(val);
                    }
                  }}
                  placeholder={user?.nickname || 'User'}
                  disabled={isRefreshing}
                />
              </div>
            </div>
            <div className={styles.inlineField}>
              <div className={styles.fieldLabel}>{t('profile.fields.studentId')}</div>
              <div className={styles.fieldControl}>
                {/* student id icon */}
                <svg className={styles.fieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="14" rx="2" />
                  <path d="M3 8h18" />
                </svg>
                <input
                  className={styles.nameInput}
                  type="text"
                  value={user.student_id}
                  disabled
                />
                <Tooltip title={!showStudentId ? t('profile.fields.studentIdHidden') : t('profile.fields.studentIdVisible')}>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    aria-label={!showStudentId ? t('profile.fields.studentIdHidden') : t('profile.fields.studentIdVisible')}
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowStudentId((v: boolean) => !v)}
                  >
                    {!showStudentId ? (
                      <svg className={styles.ghostIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.77 21.77 0 0 1 5.06-5.94" />
                        <path d="M1 1l22 22" />
                        <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-5.12" />
                      </svg>
                    ) : (
                      <svg className={styles.ghostIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </Tooltip>
              </div>
            </div>
            
            {/* 院系选择 */}
            <div className={styles.inlineField}>
              <div className={styles.fieldLabel}>{t('profile.fields.department')}</div>
              <div className={styles.fieldControl}>
                {/* department icon */}
                <svg className={styles.fieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18" />
                  <path d="M5 21V7l8-4v18" />
                  <path d="M19 21V11l-6-4" />
                </svg>
                <div className={styles.selectWrapper}>
                  <Select
                    value={departmentInput || undefined}
                    onChange={(val) => {
                      handleDepartmentChange(val);
                    }}
                    options={departments}
                    placeholder={t('profile.fields.department')}
                    disabled={isRefreshing}
                    showSearch={false}
                    popupMatchSelectWidth
                    listHeight={200}
                  />
                </div>
                <Tooltip title={!showDepartment ? t('profile.fields.departmentHidden') : t('profile.fields.departmentVisible')}>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    aria-label={!showDepartment ? t('profile.fields.departmentHidden') : t('profile.fields.departmentVisible')}
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowDepartment((v: boolean) => !v)}
                  >
                    {!showDepartment ? (
                      <svg className={styles.ghostIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.77 21.77 0 0 1 5.06-5.94" />
                        <path d="M1 1l22 22" />
                        <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-5.12" />
                      </svg>
                    ) : (
                      <svg className={styles.ghostIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* 专业选择 */}
            <div className={styles.inlineField}>
              <div className={styles.fieldLabel}>{t('profile.fields.major')}</div>
              <div className={styles.fieldControl}>
                {/* major icon */}
                <svg className={styles.fieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                <div className={styles.selectWrapper}>
                  <Select
                    value={majorInput || undefined}
                    onChange={(val) => {
                      setMajorInput(val);
                    }}
                    options={availableMajors}
                    placeholder={t('profile.fields.major')}
                    disabled={isRefreshing || !departmentInput}
                    showSearch={false}
                    popupMatchSelectWidth
                    listHeight={200}
                  />
                </div>
                <Tooltip title={!showMajor ? t('profile.fields.majorHidden') : t('profile.fields.majorVisible')}>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    aria-label={!showMajor ? t('profile.fields.majorHidden') : t('profile.fields.majorVisible')}
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowMajor((v: boolean) => !v)}
                  >
                    {!showMajor ? (
                      <svg className={styles.ghostIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.77 21.77 0 0 1 5.06-5.94" />
                        <path d="M1 1l22 22" />
                        <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-5.12" />
                      </svg>
                    ) : (
                      <svg className={styles.ghostIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* 个人介绍 */}
            <div className={styles.inlineField}>
              <div className={styles.fieldLabel}>{t('profile.fields.bio')}</div>
              <div className={styles.fieldControl}>
                {/* bio icon */}
                <svg className={styles.fieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10,9 9,9 8,9" />
                </svg>
                <textarea
                  className={styles.bioInput}
                  value={bioInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    // 计算长度：中文字符算2个单位，其他字符算1个单位
                    const lengthUnits = Array.from(val).reduce((sum, ch) => 
                      sum + (/[\u4e00-\u9fa5]/.test(ch) ? 2 : 1), 0
                    );
                    // 限制总长度不超过100个单位
                    if (lengthUnits <= 100) {
                      setBioInput(val);
                    }
                  }}
                  placeholder={t('userProfile.placeholders.noBio')}
                  disabled={isRefreshing}
                  rows={3}
                />
                <Tooltip title={!showBio ? t('profile.fields.bioHidden') : t('profile.fields.bioVisible')}>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    aria-label={!showBio ? t('profile.fields.bioHidden') : t('profile.fields.bioVisible')}
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowBio((v: boolean) => !v)}
                  >
                    {!showBio ? (
                      <svg className={styles.ghostIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.77 21.77 0 0 1 5.06-5.94" />
                        <path d="M1 1l22 22" />
                        <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-5.12" />
                      </svg>
                    ) : (
                      <svg className={styles.ghostIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        )}
      </div>
      <AvatarUploadModal
        open={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        onUploaded={handleAvatarUploaded}
      />
      <SystemAvatarModal
        open={systemAvatarModalOpen}
        onClose={() => setSystemAvatarModalOpen(false)}
        onSelected={handleAvatarUploaded}
      />
    </div>
  );
}
