import React, { useEffect, useState } from 'react';
import { Modal, message } from 'antd';
import { useTranslation } from 'next-i18next';
import { getSystemAvatars, setSystemAvatar } from '@/services/userAvatarService';
import { translateApiMessage } from '@/utils/messageTranslator';
import styles from '@/styles/SystemAvatarModal.module.css';
import Image from 'next/image';
import Tooltip from '@/components/Tooltip';

interface SystemAvatarModalProps {
  open: boolean;
  onClose: () => void;
  onSelected?: (response: any) => void;
}

export default function SystemAvatarModal({ open, onClose, onSelected }: SystemAvatarModalProps) {
  const { t } = useTranslation('common');
  const [uploading, setUploading] = useState(false);
  const [systemAvatars, setSystemAvatars] = useState<Array<{
    filename: string;
    name: string;
    url: string;
  }>>([]);
  const [loadingSystemAvatars, setLoadingSystemAvatars] = useState(false);
  const [selectedSystemAvatar, setSelectedSystemAvatar] = useState<string>('');

  // 加载系统头像
  useEffect(() => {
    if (open && systemAvatars.length === 0) {
      const loadSystemAvatars = async () => {
        setLoadingSystemAvatars(true);
        try {
          const res = await getSystemAvatars();
          if (res.status === 'success' && res.data) {
            setSystemAvatars(res.data.avatars);
          } else {
            message.error(translateApiMessage(res, t));
          }
        } catch (error) {
          message.error(t('messages.loadSystemAvatarsFailed'));
        } finally {
          setLoadingSystemAvatars(false);
        }
      };
      loadSystemAvatars();
    }
  }, [open, systemAvatars.length, t]);

  // 处理系统头像选择
  const handleSystemAvatarSelect = async (filename: string) => {
    try {
      setUploading(true);
      const res = await setSystemAvatar(filename);
      if (res.status === 'success') {
        onSelected?.(res);
        onClose();
      } else {
        message.error(translateApiMessage(res, t));
      }
    } finally {
      setUploading(false);
      setSelectedSystemAvatar('');
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => !uploading && onClose()}
      onOk={() => onClose()}
      okButtonProps={{ disabled: uploading }}
      cancelButtonProps={{ disabled: uploading }}
      title={t('profile.actions.gallery')}
      footer={null}
      destroyOnHidden
      width={720}
      style={{ top: '10%' }}
      classNames={{ content: styles.modalContent, body: styles.modalBody }}
    >
      <div className={styles.modalInner}>
        {loadingSystemAvatars ? (
          <div className={styles.loadingGrid}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={styles.loadingAvatar} />
            ))}
          </div>
        ) : (
          <>
            <div className={styles.systemAvatars}>
              {systemAvatars.map((avatar) => (
                <Tooltip 
                  key={avatar.filename}
                  title={avatar.filename.replace(/\.png$/i, '')}
                >
                  <div
                    className={`${styles.systemAvatar} ${selectedSystemAvatar === avatar.filename ? styles.selected : ''}`}
                    onClick={() => !uploading && setSelectedSystemAvatar(avatar.filename)}
                  >
                    <Image 
                      src={avatar.url} 
                      alt={avatar.name}
                      width={80}
                      height={80}
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                </Tooltip>
              ))}
            </div>
            {selectedSystemAvatar && (
              <div className={styles.actionButtons}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setSelectedSystemAvatar('')}
                  disabled={uploading}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  className={styles.confirmButton}
                  onClick={() => handleSystemAvatarSelect(selectedSystemAvatar)}
                  disabled={uploading}
                >
                  {uploading ? (
                    <span className={styles.loadingDots}>
                      <span>.</span><span>.</span><span>.</span>
                    </span>
                  ) : t('common.confirm')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
