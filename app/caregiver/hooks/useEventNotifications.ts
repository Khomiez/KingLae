"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { playSound, playSOSAlert, requestNotificationPermission, showNotification, areNotificationsSupported } from "../lib/sounds";

export interface NotificationOptions {
  sound?: boolean;
  browser?: boolean;
  soundVolume?: number;
  mute?: boolean;
}

export interface UseEventNotificationsReturn {
  isMuted: boolean;
  hasNotificationPermission: boolean;
  notificationsSupported: boolean;
  toggleMute: () => void;
  requestPermission: () => Promise<boolean>;
  notifyEvent: (eventType: string, patientName?: string) => void;
  notifyCustom: (title: string, message: string, type?: 'sos' | 'assist' | 'info' | 'success') => void;
}

/**
 * Hook for managing event notifications in the caregiver app
 * Handles audio playback and browser notifications
 */
export function useEventNotifications(options: NotificationOptions = {}): UseEventNotificationsReturn {
  const {
    sound: enableSound = true,
    browser: enableBrowser = true,
    soundVolume = 0.5,
    mute: initiallyMuted = false,
  } = options;

  const [isMuted, setIsMuted] = useState(initiallyMuted);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [notificationsSupported, setNotificationsSupported] = useState(false);
  const lastNotificationTime = useRef<number>(0);
  const notificationCooldown = 2000; // 2 seconds cooldown between identical notifications

  // Check notification support and permission on mount (client-side only)
  useEffect(() => {
    setNotificationsSupported(areNotificationsSupported());
    if (areNotificationsSupported()) {
      setHasNotificationPermission(Notification.permission === 'granted');
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await requestNotificationPermission();
    setHasNotificationPermission(granted);
    return granted;
  }, []);

  const notifyEvent = useCallback((eventType: string, patientName?: string) => {
    const now = Date.now();

    // Prevent notification spam - enforce cooldown
    if (now - lastNotificationTime.current < notificationCooldown) {
      return;
    }
    lastNotificationTime.current = now;

    const isSOS = eventType.toUpperCase() === 'SOS';
    const soundType = isSOS ? 'sos' : 'assist';

    // Play sound
    if (enableSound && !isMuted) {
      if (isSOS) {
        playSOSAlert(soundVolume, 2); // Play SOS alert twice for urgency
      } else {
        playSound(soundType, soundVolume);
      }
    }

    // Show browser notification
    if (enableBrowser && hasNotificationPermission) {
      const title = isSOS ? '🚨 ฉุกเฉิน SOS' : '📢 ขอความช่วยเหลือ';
      const body = patientName
        ? `ผู้ป่วย: ${patientName}`
        : 'มีเหตุการณ์ใหม่ที่ต้องตรวจสอบ';

      showNotification(title, {
        body,
        tag: `event-${eventType}-${now}`,
        requireInteraction: isSOS, // SOS notifications must be explicitly dismissed
        vibrate: isSOS ? [200, 100, 200] : [100],
      });
    }
  }, [enableSound, enableBrowser, isMuted, soundVolume, hasNotificationPermission]);

  const notifyCustom = useCallback((
    title: string,
    message: string,
    type: 'sos' | 'assist' | 'info' | 'success' = 'info'
  ) => {
    const now = Date.now();

    // Prevent notification spam
    if (now - lastNotificationTime.current < notificationCooldown) {
      return;
    }
    lastNotificationTime.current = now;

    // Play sound
    if (enableSound && !isMuted) {
      playSound(type, soundVolume);
    }

    // Show browser notification
    if (enableBrowser && hasNotificationPermission) {
      showNotification(title, {
        body: message,
        tag: `custom-${type}-${now}`,
      });
    }
  }, [enableSound, enableBrowser, isMuted, soundVolume, hasNotificationPermission]);

  return {
    isMuted,
    hasNotificationPermission,
    notificationsSupported,
    toggleMute,
    requestPermission,
    notifyEvent,
    notifyCustom,
  };
}

/**
 * Higher-order hook that automatically manages notification permission requests
 */
export function useEventNotificationsWithPrompt(options: NotificationOptions = {}): UseEventNotificationsReturn {
  const notifications = useEventNotifications(options);

  // Prompt for notification permission on first user interaction
  useEffect(() => {
    if (!notifications.hasNotificationPermission && notifications.notificationsSupported) {
      const handleUserInteraction = async () => {
        await notifications.requestPermission();
        // Remove listeners after first interaction
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
      };

      // Wait for user interaction before requesting permission
      document.addEventListener('click', handleUserInteraction, { once: true });
      document.addEventListener('touchstart', handleUserInteraction, { once: true });
      document.addEventListener('keydown', handleUserInteraction, { once: true });

      return () => {
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
      };
    }
  }, [notifications]);

  return notifications;
}
