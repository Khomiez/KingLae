"use client";

import { useEffect, useState, useCallback } from "react";
import { useEventNotificationsWithPrompt } from "../hooks/useEventNotifications";

export type EventNotificationType = 'SOS' | 'ASSIST' | 'INFO' | 'SUCCESS';

export interface EventNotificationData {
  id: string;
  type: EventNotificationType;
  patientName?: string;
  message?: string;
  timestamp: number;
  duration?: number;
}

interface EventNotificationProps {
  // Optional: manually trigger notifications
  onNotification?: (data: EventNotificationData) => void;
  // Optional: auto-hide duration in milliseconds
  defaultDuration?: number;
  // Optional: position for toasts
  position?: 'top' | 'top-right' | 'top-left' | 'bottom' | 'bottom-right' | 'bottom-left';
}

/**
 * Toast/Snackbar notification system for caregiver app
 * Displays visual notifications for urgent events
 */
export default function EventNotification({
  onNotification,
  defaultDuration = 5000,
  position = 'top',
}: EventNotificationProps) {
  const [notifications, setNotifications] = useState<EventNotificationData[]>([]);
  const { notifyEvent, notifyCustom } = useEventNotificationsWithPrompt({
    sound: true,
    browser: true,
  });

  // Add a new notification
  const addNotification = useCallback((data: EventNotificationData) => {
    const notification: EventNotificationData = {
      ...data,
      timestamp: Date.now(),
      duration: data.duration ?? defaultDuration,
    };

    setNotifications(prev => {
      // Remove any existing notification with the same ID (update scenario)
      const filtered = prev.filter(n => n.id !== notification.id);
      return [...filtered, notification];
    });

    // Trigger audio/browser notifications
    if (data.type === 'SOS' || data.type === 'ASSIST') {
      notifyEvent(data.type, data.patientName);
    } else {
      notifyCustom(
        data.message || 'Notification',
        data.patientName || '',
        data.type.toLowerCase() as any
      );
    }

    // Call external callback if provided
    if (onNotification) {
      onNotification(notification);
    }

    // Auto-remove after duration
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        removeNotification(notification.id);
      }, notification.duration);
    }
  }, [defaultDuration, notifyEvent, notifyCustom, onNotification]);

  // Remove a notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Expose methods to parent components via ref or window
  useEffect(() => {
    // Attach to window for global access
    (window as any).showEventNotification = addNotification;
    (window as any).clearEventNotifications = clearAll;

    return () => {
      delete (window as any).showEventNotification;
      delete (window as any).clearEventNotifications;
    };
  }, [addNotification, clearAll]);

  // Get position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'top-4 left-1/2 -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom':
        return 'bottom-4 left-1/2 -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 left-1/2 -translate-x-1/2';
    }
  };

  // Get notification color based on type
  const getNotificationStyles = (type: EventNotificationType) => {
    switch (type) {
      case 'SOS':
        return {
          bg: 'bg-red-500',
          border: 'border-red-600',
          icon: 'emergency',
          iconBg: 'bg-red-600',
        };
      case 'ASSIST':
        return {
          bg: 'bg-amber-500',
          border: 'border-amber-600',
          icon: 'pan_tool',
          iconBg: 'bg-amber-600',
        };
      case 'INFO':
        return {
          bg: 'bg-blue-500',
          border: 'border-blue-600',
          icon: 'info',
          iconBg: 'bg-blue-600',
        };
      case 'SUCCESS':
        return {
          bg: 'bg-green-500',
          border: 'border-green-600',
          icon: 'check_circle',
          iconBg: 'bg-green-600',
        };
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      className={`fixed z-50 ${getPositionClasses()} flex flex-col gap-2 max-w-sm w-full`}
    >
      {notifications.map((notification) => {
        const styles = getNotificationStyles(notification.type);

        return (
          <div
            key={notification.id}
            className={`${styles.bg} ${styles.border} border-2 rounded-xl shadow-lg p-4 flex items-start gap-3 animate-slide-down text-white`}
          >
            {/* Icon */}
            <div className={`${styles.iconBg} rounded-full p-2 shrink-0`}>
              <span className="material-symbols-outlined text-xl">
                {styles.icon}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {notification.type === 'SOS' && (
                <h4 className="font-bold text-sm mb-1">🚨 ฉุกเฉิน SOS</h4>
              )}
              {notification.type === 'ASSIST' && (
                <h4 className="font-bold text-sm mb-1">📢 ขอความช่วยเหลือ</h4>
              )}

              {notification.patientName && (
                <p className="text-sm font-medium">
                  ผู้ป่วย: {notification.patientName}
                </p>
              )}

              {notification.message && (
                <p className="text-sm opacity-90 mt-1">
                  {notification.message}
                </p>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={() => removeNotification(notification.id)}
              className="shrink-0 hover:bg-white/20 rounded-full p-1 transition-colors"
              aria-label="Close notification"
            >
              <span className="material-symbols-outlined text-lg">
                close
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Hook to programmatically show notifications from any component
 */
export function useShowNotification() {
  return {
    showNotification: (data: Omit<EventNotificationData, 'timestamp'>) => {
      const fn = (window as any).showEventNotification;
      if (typeof fn === 'function') {
        fn({ ...data, timestamp: Date.now() });
      }
    },
    clearNotifications: () => {
      const fn = (window as any).clearEventNotifications;
      if (typeof fn === 'function') {
        fn();
      }
    },
  };
}
