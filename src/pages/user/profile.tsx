import React, { useEffect, useState } from 'react';
import SideBar from '@/components/SideBar';
import Avatar from '@/components/Avatar';
import ProtectedRoute from '@/components/ProtectedRoute';
import CustomSelect from '@/components/CustomSelect';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import styles from '@/styles/Profile.module.css';
import Image from 'next/image';
import { getUserProfile } from '@/services/userProfileService';
import { useRouter } from 'next/router';

export default function UserProfilePage() {
  const { t } = useTranslation('common');
  const { t: tAcademic } = useTranslation('academic');
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'messages'>('overview');
  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  // 临时去除可视性逻辑，由后端支持后再接入
  const [maskStudentId, setMaskStudentId] = useState(false); // 仅前端视觉：切换眼睛图标斜杠
  const [maskDepartment, setMaskDepartment] = useState(false);
  const [maskMajor, setMaskMajor] = useState(false);
  const [maskBio, setMaskBio] = useState(false);
  
  // 新增字段状态
  const [departmentInput, setDepartmentInput] = useState('');
  const [majorInput, setMajorInput] = useState('');
  const [bioInput, setBioInput] = useState('');

  const router = useRouter();

  // 院系和专业选项数据
  const departments = [
    { value: 'computerScience', label: tAcademic('departments.computerScience') },
    { value: 'mathematics', label: tAcademic('departments.mathematics') }
  ];

  const majors = {
    computerScience: [
      { value: 'cs', label: tAcademic('majors.computerScience.cs') },
      { value: 'ai', label: tAcademic('majors.computerScience.ai') },
      { value: 'informationSecurity', label: tAcademic('majors.computerScience.informationSecurity') },
      { value: 'confidentiality', label: tAcademic('majors.computerScience.confidentiality') },
      { value: 'csElite', label: tAcademic('majors.computerScience.csElite') }
    ],
    mathematics: [
      { value: 'pureMath', label: tAcademic('majors.mathematics.pureMath') },
      { value: 'appliedMath', label: tAcademic('majors.mathematics.appliedMath') },
      { value: 'financialMath', label: tAcademic('majors.mathematics.financialMath') },
      { value: 'bigData', label: tAcademic('majors.mathematics.bigData') },
      { value: 'cryptography', label: tAcademic('majors.mathematics.cryptography') }
    ]
  };

  // 根据选择的院系获取对应专业
  const getAvailableMajors = () => {
    if (!departmentInput) return [];
    return majors[departmentInput as keyof typeof majors] || [];
  };

  // 院系变化时重置专业选择
  const handleDepartmentChange = (newDepartment: string) => {
    setDepartmentInput(newDepartment);
    setMajorInput(''); // 重置专业选择
  };


  useEffect(() => {
    const load = async () => {
      try {
        const userId = typeof router.query.id === 'string' ? router.query.id : undefined;
        const res = await getUserProfile(userId);
        if (res.status === 'success' && res.user) {
          setUser(res.user);
          setNameInput(res.user?.nickname || '');
          // 这些字段暂时为空，等后端支持后再从user对象读取
          setDepartmentInput('');
          setMajorInput('');
          setBioInput('');
        }
      } catch (e) {
        // 忽略错误，后续可加错误提示
      }
    };
    load();
  }, [router.query.id]);


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
            {activeTab === 'overview' && (
              <div className={styles.heroCard}>
                {!editing ? (
                  <button
                    type="button"
                    className={styles.cardAction}
                    aria-label={t('profile.actions.edit')}
                    title={t('profile.actions.edit')}
                    onClick={() => setEditing(true)}
                  >
                    {/* edit (pencil) */}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.cardActionIcon}>
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                  </button>
                ) : (
                  <div className={styles.cardActionGroup}>
                    <button
                      type="button"
                      className={styles.cardAction}
                      aria-label={t('profile.actions.save')}
                      title={t('profile.actions.save')}
                      onClick={async () => {
                        // 刷新卡片，不落库
                        try {
                          setIsRefreshing(true);
                          const userId = typeof router.query.id === 'string' ? router.query.id : undefined;
                          const res = await getUserProfile(userId);
                          if (res.status === 'success' && res.user) {
                            setUser(res.user);
                            setNameInput(res.user?.nickname || '');
                            // 这些字段暂时为空，等后端支持后再从user对象读取
                            setDepartmentInput('');
                            setMajorInput('');
                            setBioInput('');
                          }
                        } finally {
                          setIsRefreshing(false);
                          // 保存时依据可视状态决定展示：若不可视则在浏览态隐藏学号
                          setEditing(false);
                        }
                      }}
                    >
                      {/* save (check) */}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.cardActionIcon}>
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={styles.cardAction}
                      aria-label={t('profile.actions.discard')}
                      title={t('profile.actions.discard')}
                      onClick={() => {
                        setNameInput(user?.nickname || '');
                        // 重置为空值
                        setDepartmentInput('');
                        setMajorInput('');
                        setBioInput('');
                        setEditing(false);
                      }}
                    >
                      {/* discard (x) */}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.cardActionIcon}>
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
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
                          <button type="button" className={styles.avatarEditAction} aria-label={t('profile.actions.upload')}
                            title={t('profile.actions.upload')}>
                            {/* plus icon */}
                            <svg className={styles.avatarEditIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </button>
                          <button type="button" className={styles.avatarEditAction} aria-label={t('profile.actions.gallery')}
                            title={t('profile.actions.gallery')}>
                            {/* gallery icon */}
                            <svg className={styles.avatarEditIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="14" rx="2" />
                              <circle cx="8.5" cy="9.5" r="1.5" />
                              <path d="M21 14l-4.5-4.5L12 14l-2.5-2.5L3 18" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className={styles.heroBody}>
                  {!editing ? (
                    <div className={styles.displayGroup}>
                      <h1 className={styles.displayName}>{user?.nickname || 'User'}</h1>
                      {user?.student_id && !maskStudentId && (
                        <div className={styles.metaText}>{user.student_id}</div>
                      )}
                      {departmentInput && !maskDepartment && (
                        <div className={styles.metaText}>
                          {departments.find(d => d.value === departmentInput)?.label || departmentInput}
                        </div>
                      )}
                      {majorInput && !maskMajor && (
                        <div className={styles.metaText}>
                          {getAvailableMajors().find(m => m.value === majorInput)?.label || majorInput}
                        </div>
                      )}
                      {bioInput && !maskBio && (
                        <div className={styles.bioText}>{bioInput}</div>
                      )}
                    </div>
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
                          // 限制：20英文或10中文（粗略：中文占2单位，英文占1单位）
                          const lengthUnits = Array.from(val).reduce((sum, ch) => sum + (/[\u4e00-\u9fa5]/.test(ch) ? 2 : 1), 0);
                          if (lengthUnits <= 20) setNameInput(val);
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
                          {/* 眼睛按钮（仅前端视觉切换，不接逻辑） */}
                          <button
                            type="button"
                            className={styles.ghostButton}
                            aria-label={maskStudentId ? t('profile.fields.studentIdHidden') : t('profile.fields.studentIdVisible')}
                            title={maskStudentId ? t('profile.fields.studentIdHidden') : t('profile.fields.studentIdVisible')}
                            tabIndex={-1}
                            onMouseDown={(e) => e.preventDefault()} // 防止触发父容器 focus-within 高亮
                            onClick={() => setMaskStudentId((v) => !v)}
                          >
                            {maskStudentId ? (
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
                            <CustomSelect
                              value={departmentInput ? departments.find(d => d.value === departmentInput) || null : null}
                              onChange={(selectedOption) => {
                                if (selectedOption) {
                                  handleDepartmentChange(selectedOption.value);
                                }
                              }}
                              options={departments}
                              placeholder={t('profile.fields.department')}
                              isDisabled={isRefreshing}
                            />
                            <button
                              type="button"
                              className={styles.ghostButton}
                              aria-label={maskDepartment ? t('profile.fields.departmentHidden') : t('profile.fields.departmentVisible')}
                              title={maskDepartment ? t('profile.fields.departmentHidden') : t('profile.fields.departmentVisible')}
                              tabIndex={-1}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => setMaskDepartment((v) => !v)}
                            >
                              {maskDepartment ? (
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
                            <CustomSelect
                              value={majorInput ? getAvailableMajors().find(m => m.value === majorInput) || null : null}
                              onChange={(selectedOption) => {
                                if (selectedOption) {
                                  setMajorInput(selectedOption.value);
                                }
                              }}
                              options={getAvailableMajors()}
                              placeholder={t('profile.fields.major')}
                              isDisabled={isRefreshing || !departmentInput}
                            />
                            <button
                              type="button"
                              className={styles.ghostButton}
                              aria-label={maskMajor ? t('profile.fields.majorHidden') : t('profile.fields.majorVisible')}
                              title={maskMajor ? t('profile.fields.majorHidden') : t('profile.fields.majorVisible')}
                              tabIndex={-1}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => setMaskMajor((v) => !v)}
                            >
                              {maskMajor ? (
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
                              onChange={(e) => setBioInput(e.target.value)}
                              placeholder={t('userProfile.placeholders.noBio')}
                              disabled={isRefreshing}
                              rows={3}
                            />
                            <button
                              type="button"
                              className={styles.ghostButton}
                              aria-label={maskBio ? t('profile.fields.bioHidden') : t('profile.fields.bioVisible')}
                              title={maskBio ? t('profile.fields.bioHidden') : t('profile.fields.bioVisible')}
                              tabIndex={-1}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => setMaskBio((v) => !v)}
                            >
                              {maskBio ? (
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
                          </div>
                        </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'resources' && (
              <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>{t('userProfile.sections.resources')}</h2>
                <p className={styles.muted}>{t('userProfile.placeholders.noResources')}</p>
              </div>
            )}
            {activeTab === 'messages' && (
              <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>{t('userProfile.sections.messages')}</h2>
                <p className={styles.muted}>{t('userProfile.placeholders.noMessages')}</p>
              </div>
            )}
          </section>
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


