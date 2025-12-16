import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { getNotifications, Notification, markAsRead, markAllAsRead, deleteNotification } from '@/services/notificationService';
import { formatDateTime } from '@/utils/dateUtils';
import { showToast } from '@/components/global/Toast';
import Tooltip from '@/components/global/Tooltip';
import NotificationDetailModal from './NotificationDetailModal';
import styles from '@/styles/notifications/NotificationsTab.module.css';

export default function MessagesTab() {
  const { t, i18n } = useTranslation('common');
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // 使用exclude_type参数排除announcement类型
      const response = await getNotifications({
        page,
        limit: 20,
        exclude_type: 'announcement'
      });
      if (response.status === 'success' && response.data) {
        setNotifications(response.data.notifications);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      showToast(t('notifications.loadFailed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [page]);

  const handleToggleRead = async (id: number, currentStatus: boolean) => {
    try {
      if (!currentStatus) {
        await markAsRead(id);
        setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      } else {
        // TODO: 实现标记为未读的API
        setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: false } : n));
      }
    } catch (error) {
      console.error('Failed to toggle read status:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      showToast(t('notifications.markAllReadSuccess'), 'success');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      showToast(t('notifications.markAllReadFailed'), 'error');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(t('notifications.confirmDeleteAll'))) {
      return;
    }
    try {
      await Promise.all(notifications.map(n => deleteNotification(n.id)));
      setNotifications([]);
      showToast(t('notifications.deleteAllSuccess'), 'success');
      loadNotifications();
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
      showToast(t('notifications.deleteAllFailed'), 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
      showToast(t('notifications.deleteSuccess'), 'success');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      showToast(t('notifications.deleteFailed'), 'error');
    }
  };

  const handleClickNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setDetailModalOpen(true);
    if (!notification.is_read) {
      handleToggleRead(notification.id, false);
    }
  };

  const getNotificationTitle = (notification: Notification): string => {
    switch (notification.type) {
      case 'resource':
        return notification.title || t('notifications.types.resource');
      case 'review':
        return notification.title || t('notifications.types.review');
      case 'comment':
        return notification.title || t('notifications.types.comment');
      case 'system':
        return notification.title || t('notifications.types.system');
      default:
        return notification.title || t('notifications.message');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <p>{t('notifications.loading')}</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.toolbarButton}
          onClick={handleMarkAllAsRead}
        >
          {t('notifications.markAllAsRead')}
        </button>
        <button
          type="button"
          className={styles.toolbarButton}
          onClick={handleDeleteAll}
        >
          {t('notifications.deleteAll')}
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{t('notifications.noMessages')}</p>
        </div>
      ) : (
        <div className={styles.notificationsList}>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`${styles.notificationItem} ${!notification.is_read ? styles.unread : ''}`}
            >
              <div 
                className={styles.notificationContent}
                onClick={() => handleClickNotification(notification)}
              >
                <h3 className={styles.notificationTitle}>
                  {getNotificationTitle(notification)}
                </h3>
                {notification.content && (
                  <div className={styles.notificationBody}>
                    {notification.content}
                  </div>
                )}
                <span className={styles.notificationTime}>
                  {formatDateTime(notification.created_at, i18n.language)}
                </span>
              </div>
              <div className={styles.notificationActions}>
                <Tooltip title={notification.is_read ? t('notifications.markAsUnread') : t('notifications.markAsRead')}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleRead(notification.id, notification.is_read);
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {notification.is_read ? (
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                      ) : (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </>
                      )}
                    </svg>
                  </button>
                </Tooltip>
                <Tooltip title={t('notifications.delete')}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </Tooltip>
              </div>
            </div>
          ))}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageButton}
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                {t('notifications.prevPage')}
              </button>
              <span className={styles.pageInfo}>
                {t('notifications.pageInfo', { page, totalPages })}
              </span>
              <button
                type="button"
                className={styles.pageButton}
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                {t('notifications.nextPage')}
              </button>
            </div>
          )}
        </div>
      )}

      <NotificationDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        notification={selectedNotification}
      />
    </>
  );
}
