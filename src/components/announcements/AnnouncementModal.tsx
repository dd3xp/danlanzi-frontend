import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import styles from '@/styles/announcements/AnnouncementModal.module.css';

export interface AnnouncementFormData {
  title: string;
  content: string;
}

interface AnnouncementModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AnnouncementFormData) => Promise<void>;
  initialData?: AnnouncementFormData | null;
  submitting?: boolean;
}

export default function AnnouncementModal({
  open,
  onClose,
  onSubmit,
  initialData,
  submitting = false,
}: AnnouncementModalProps) {
  const { t } = useTranslation('common');
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    content: '',
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          title: initialData.title || '',
          content: initialData.content || '',
        });
      } else {
        setFormData({
          title: '',
          content: '',
        });
      }
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      return;
    }
    await onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({
      title: '',
      content: '',
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {initialData
              ? t('admin.announcements.editTitle')
              : t('admin.announcements.createTitle')}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
            aria-label={t('admin.announcements.cancel')}
          >
            <svg
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
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formContent}>
            <div className={styles.formItem}>
              <label className={styles.label}>
                {t('admin.announcements.form.title')} <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder={t('admin.announcements.form.titlePlaceholder')}
                required
              />
            </div>
            <div className={styles.formItem}>
              <label className={styles.label}>
                {t('admin.announcements.form.content')} <span className={styles.required}>*</span>
              </label>
              <textarea
                className={styles.textarea}
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder={t('admin.announcements.form.contentPlaceholder')}
                rows={5}
                required
              />
            </div>
          </div>
          <div className={styles.actionButtons}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleClose}
              disabled={submitting}
            >
              {t('admin.announcements.cancel')}
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitting || !formData.title.trim() || !formData.content.trim()}
            >
              {submitting
                ? t('admin.announcements.submitting')
                : initialData
                ? t('admin.announcements.update')
                : t('admin.announcements.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

