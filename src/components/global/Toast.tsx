import React, { useEffect, useState } from 'react';
import styles from '@/styles/global/Toast.module.css';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

export default function Toast({ 
  message, 
  type = 'success', 
  duration = 3000,
  onClose 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 300); // 动画时间
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4l-8 8-4-4" />
          </svg>
        );
      case 'error':
        return (
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10" cy="10" r="8" />
            <path d="M10 6v4M10 14h.01" />
          </svg>
        );
      case 'info':
        return (
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10" cy="10" r="8" />
            <path d="M10 6v4M10 14h.01" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${styles.toast} ${styles[type]} ${isExiting ? styles.exiting : ''}`}>
      <div className={styles.icon}>{getIcon()}</div>
      <div className={styles.message}>{message}</div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type?: ToastType }>;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className={styles.container}>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}

// Toast 管理器 Hook
let toastIdCounter = 0;
const toastListeners: Array<(toasts: Array<{ id: string; message: string; type?: ToastType }>) => void> = [];
let toastQueue: Array<{ id: string; message: string; type?: ToastType }> = [];

function notifyListeners() {
  toastListeners.forEach(listener => listener([...toastQueue]));
}

export function showToast(message: string, type: ToastType = 'success') {
  const id = `toast-${++toastIdCounter}`;
  toastQueue.push({ id, message, type });
  notifyListeners();
  
  // 自动移除
  setTimeout(() => {
    toastQueue = toastQueue.filter(t => t.id !== id);
    notifyListeners();
  }, 3000);
}

export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: ToastType }>>([]);

  useEffect(() => {
    const listener = (newToasts: Array<{ id: string; message: string; type?: ToastType }>) => {
      setToasts(newToasts);
    };
    
    toastListeners.push(listener);
    setToasts([...toastQueue]);
    
    return () => {
      const index = toastListeners.indexOf(listener);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  }, []);

  const removeToast = (id: string) => {
    toastQueue = toastQueue.filter(t => t.id !== id);
    notifyListeners();
  };

  return { toasts, removeToast };
}

