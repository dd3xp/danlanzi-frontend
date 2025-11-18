import React from 'react';
import { useTranslation } from 'next-i18next';
import styles from '@/styles/global/ConfirmDialog.module.css';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  content: string;
  okText?: string;
  cancelText?: string;
  okType?: 'default' | 'primary' | 'danger';
  onOk: () => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  content,
  okText,
  cancelText,
  okType = 'default',
  onOk,
  onCancel,
  loading = false
}: ConfirmDialogProps) {
  const { t } = useTranslation('common');

  if (!open) return null;

  const handleOk = async () => {
    await onOk();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onCancel();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
        </div>
        <div className={styles.body}>
          <p className={styles.content}>{content}</p>
        </div>
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText || t('avatar.actions.cancel')}
          </button>
          <button
            type="button"
            className={`${styles.okButton} ${okType === 'danger' ? styles.dangerButton : ''}`}
            onClick={handleOk}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.loadingText}>处理中...</span>
            ) : (
              okText || t('avatar.actions.confirm')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
