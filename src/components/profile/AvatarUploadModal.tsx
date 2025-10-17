import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Upload, message } from 'antd';
import type { UploadProps } from 'antd';
import { useTranslation } from 'next-i18next';
import { getSystemAvatars, uploadAvatar } from '@/services/userAvatarService';
import styles from '@/styles/profile/AvatarUploadModal.module.css';
import Cropper from 'react-easy-crop';
import { translateApiMessage } from '@/utils/translator';

// 常量配置
const UPLOAD_CONFIG = {
  MAX_SIZE_MB: 20,
  ACCEPTED_TYPES: ['image/jpeg', 'image/jpg', 'image/png'] as const,
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 5,
  ZOOM_SPEED: 0.05
} as const;

interface AvatarUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploaded?: (response: any) => void;
  maxSizeMB?: number;
}

export default function AvatarUploadModal({ open, onClose, onUploaded, maxSizeMB = 20 }: AvatarUploadModalProps) {
  const { t } = useTranslation('common');
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<'upload'|'system'>('upload');
  const [step, setStep] = useState<'pick'|'crop'>('pick');
  const [src, setSrc] = useState<string>('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [systemAvatars, setSystemAvatars] = useState<Array<{
    filename: string;
    name: string;
    url: string;
  }>>([]);
  const [loadingSystemAvatars, setLoadingSystemAvatars] = useState(false);
  const [selectedSystemAvatar, setSelectedSystemAvatar] = useState<string>('');

  const beforeUpload = (file: File) => {
    const isValidType = UPLOAD_CONFIG.ACCEPTED_TYPES.includes(file.type as typeof UPLOAD_CONFIG.ACCEPTED_TYPES[number]);
    if (!isValidType) {
      message.error(t('messages.invalidImage'));
      return Upload.LIST_IGNORE;
    }
    const isValidSize = file.size / 1024 / 1024 < UPLOAD_CONFIG.MAX_SIZE_MB;
    if (!isValidSize) {
      message.error(t('messages.fileTooLargeWithLimit', { limit: UPLOAD_CONFIG.MAX_SIZE_MB }));
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const uploadProps: UploadProps = useMemo(() => ({
    accept: 'image/png,image/jpeg,image/jpg',
    multiple: false,
    listType: 'picture',
    beforeUpload: (file) => {
      const ok = beforeUpload(file as File);
      if (ok === Upload.LIST_IGNORE) return Upload.LIST_IGNORE;
      // 读取为DataURL进入裁剪
      const reader = new FileReader();
      reader.onload = () => {
        setSrc(String(reader.result || ''));
        setStep('crop');
      };
      reader.readAsDataURL(file as File);
      return Upload.LIST_IGNORE;
    },
    showUploadList: {
      showPreviewIcon: true,
      showRemoveIcon: true,
      showDownloadIcon: false,
    },
  }), [maxSizeMB]);

  const onCropComplete = (_: any, areaPixels: any) => setCroppedAreaPixels(areaPixels);

  // 加载系统头像
  useEffect(() => {
    if (open && tab === 'system' && systemAvatars.length === 0) {
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
  }, [open, tab, systemAvatars.length, t]);

  // 处理系统头像选择
  const handleSystemAvatarSelect = async (filename: string) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('systemAvatar', filename);
      
      const res = await uploadAvatar(formData);
      if (res.status === 'success') {
        onUploaded?.(res);
        onClose();
      } else {
        message.error(translateApiMessage(res, t));
      }
    } finally {
      setUploading(false);
      setSelectedSystemAvatar('');
    }
  };

  const handleCropConfirm = async () => {
    try {
      setUploading(true);
      if (!croppedAreaPixels || !src) return;
      // 仅传相对坐标给后端进行权威裁剪
      const img = new Image();
      img.src = src;
      await img.decode().catch(() => undefined);
      const W = img.naturalWidth || img.width;
      const H = img.naturalHeight || img.height;
      
      // 创建 FormData
      const formData = new FormData();
      
      // 从 dataURL 还原为文件并添加到 FormData
      const file = await (await fetch(src)).blob();
      formData.append('avatar', new File([file], 'avatar.jpg', { type: file.type || 'image/jpeg' }));
      
      // 添加裁剪参数
      formData.append('xPct', String(croppedAreaPixels.x / W));
      formData.append('yPct', String(croppedAreaPixels.y / H));
      formData.append('wPct', String(croppedAreaPixels.width / W));
      formData.append('hPct', String(croppedAreaPixels.height / H));
      
      const res = await uploadAvatar(formData);
      if (res.status === 'success') {
        onUploaded?.(res);
        onClose();
      } else {
        message.error(translateApiMessage(res, t));
      }
    } finally {
      setUploading(false);
      setStep('pick');
      setSrc('');
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => {
        if (!uploading) {
          setStep('pick');
          setSrc('');
          setCrop({ x: 0, y: 0 });
          setZoom(1);
          setCroppedAreaPixels(null);
          onClose();
        }
      }}
      onOk={() => {
        setStep('pick');
        setSrc('');
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        onClose();
      }}
      okButtonProps={{ disabled: uploading }}
      cancelButtonProps={{ disabled: uploading }}
      title={<div className={styles.titleRow}>{t('profile.actions.upload')}</div>}
      footer={null}
      destroyOnHidden
      width={720}
      style={{ top: '10%' }}
      classNames={{ content: styles.modalContent, body: styles.modalBody }}
    >
      <div className={styles.modalInner}>
        {step === 'pick' ? (
          <Upload.Dragger {...uploadProps} disabled={uploading} className={styles.dragger}>
            <div className={styles.dragInner}>
              <div className={styles.uploadIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className={styles.dragTitle}>{t('messages.dragHereOrClick')}</p>
              <p className={styles.dragDesc}>
                {t('messages.supportedTypes')} {UPLOAD_CONFIG.MAX_SIZE_MB}MB
              </p>
            </div>
          </Upload.Dragger>
        ) : (
          <>
            <div className={styles.cropArea}>
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                showGrid={false}
                minZoom={UPLOAD_CONFIG.MIN_ZOOM}
                maxZoom={UPLOAD_CONFIG.MAX_ZOOM}
                zoomSpeed={UPLOAD_CONFIG.ZOOM_SPEED}
              />
            </div>
            <div className={styles.actionButtons}>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={() => { setStep('pick'); setSrc(''); }}
                disabled={uploading}
              >
                {t('avatar.actions.cancel')}
              </button>
              <button 
                type="button" 
                className={styles.confirmButton}
                onClick={handleCropConfirm}
                disabled={uploading}
              >
                {uploading ? (
                  <span className={styles.loadingDots}>
                    <span>.</span><span>.</span><span>.</span>
                  </span>
                ) : t('avatar.actions.confirm')}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}


