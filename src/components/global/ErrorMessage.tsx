import React from 'react';
import styles from '@/styles/global/ErrorMessage.module.css';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export default function ErrorMessage({ message, className }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div className={`${styles.errorMessage} ${className || ''}`}>
      <svg className={styles.errorIcon} viewBox="0 0 20 20">
        <path 
          fillRule="evenodd" 
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
          clipRule="evenodd" 
        />
      </svg>
      {message}
    </div>
  );
}
