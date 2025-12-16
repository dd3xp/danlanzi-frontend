import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { createReport, CreateReportParams } from '@/services/reportService';
import { showToast } from '@/components/global/Toast';
import styles from '@/styles/report/ReportModal.module.css';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  entityType: 'resource' | 'review' | 'resource_comment' | 'review_comment';
  entityId: number;
}

export default function ReportModal({
  open,
  onClose,
  onSuccess,
  entityType,
  entityId,
}: ReportModalProps) {
  const { t } = useTranslation('common');
  const [reason, setReason] = useState<'plagiarism' | 'abuse' | 'spam' | 'other'>('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const params: CreateReportParams = {
        entity_type: entityType,
        entity_id: entityId,
        reason,
        details: details.trim() || undefined,
      };
      const response = await createReport(params);
      if (response.status === 'success') {
        showToast(t('report.submitSuccess'), 'success');
        setReason('spam');
        setDetails('');
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        showToast(response.message || t('report.submitFailed'), 'error');
      }
    } catch (error: any) {
      console.error('Failed to submit report:', error);
      showToast(error.message || t('report.submitFailed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('spam');
    setDetails('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t('report.title')}</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
            aria-label={t('report.cancel')}
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
                {t('report.reason')} <span className={styles.required}>*</span>
              </label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="reason"
                    value="plagiarism"
                    checked={reason === 'plagiarism'}
                    onChange={(e) => setReason(e.target.value as any)}
                    className={styles.radioInput}
                  />
                  <span>{t('report.reasons.plagiarism')}</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="reason"
                    value="abuse"
                    checked={reason === 'abuse'}
                    onChange={(e) => setReason(e.target.value as any)}
                    className={styles.radioInput}
                  />
                  <span>{t('report.reasons.abuse')}</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="reason"
                    value="spam"
                    checked={reason === 'spam'}
                    onChange={(e) => setReason(e.target.value as any)}
                    className={styles.radioInput}
                  />
                  <span>{t('report.reasons.spam')}</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="reason"
                    value="other"
                    checked={reason === 'other'}
                    onChange={(e) => setReason(e.target.value as any)}
                    className={styles.radioInput}
                  />
                  <span>{t('report.reasons.other')}</span>
                </label>
              </div>
            </div>
            <div className={styles.formItem}>
              <label className={styles.label}>
                {t('report.details')}
              </label>
              <textarea
                className={styles.textarea}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={t('report.detailsPlaceholder')}
                rows={4}
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
              {t('report.cancel')}
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitting}
            >
              {submitting ? t('report.submitting') : t('report.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

