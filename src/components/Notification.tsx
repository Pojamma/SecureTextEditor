import React, { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import './Notification.css';

export const Notification: React.FC = () => {
  const { notification, hideNotification } = useUIStore();

  useEffect(() => {
    if (notification.visible) {
      const timer = setTimeout(() => {
        hideNotification();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [notification.visible, hideNotification]);

  if (!notification.visible) return null;

  return (
    <div className={`notification notification-${notification.type}`}>
      <span className="notification-icon">
        {notification.type === 'success' && '✓'}
        {notification.type === 'error' && '✕'}
        {notification.type === 'warning' && '⚠'}
        {notification.type === 'info' && 'ℹ'}
      </span>
      <span className="notification-message">{notification.message}</span>
      <button className="notification-close" onClick={hideNotification}>
        ✕
      </button>
    </div>
  );
};
