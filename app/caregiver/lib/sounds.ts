/**
 * Sound management for caregiver app notifications
 * Uses Web Audio API to generate sounds without external audio files
 */

export type SoundType = 'sos' | 'assist' | 'info' | 'success';

// Audio context for playing sounds
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Play a notification sound using Web Audio API
 * Generates sounds programmatically without external files
 */
export function playSound(type: SoundType, volume: number = 0.5): void {
  if (typeof window === 'undefined') return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume context if suspended (required for some browsers)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    gainNode.gain.value = volume;

    const now = ctx.currentTime;

    switch (type) {
      case 'sos':
        // Urgent SOS pattern: rapid high-pitched beeps
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(880, now); // High pitch
        oscillator.frequency.setValueAtTime(880, now + 0.1);
        oscillator.frequency.setValueAtTime(1100, now + 0.15);
        oscillator.frequency.setValueAtTime(1100, now + 0.25);
        oscillator.frequency.setValueAtTime(880, now + 0.3);
        oscillator.frequency.setValueAtTime(880, now + 0.4);

        gainNode.gain.setValueAtTime(volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;

      case 'assist':
        // ASSIST pattern: two medium-pitched beeps
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(660, now);
        oscillator.frequency.setValueAtTime(660, now + 0.15);

        gainNode.gain.setValueAtTime(volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;

      case 'info':
        // INFO pattern: single soft chime
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, now); // C5

        gainNode.gain.setValueAtTime(volume * 0.7, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        oscillator.start(now);
        oscillator.stop(now + 0.2);
        break;

      case 'success':
        // SUCCESS pattern: ascending major third
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, now); // C5
        oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5

        gainNode.gain.setValueAtTime(volume * 0.8, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;
    }
  } catch (error) {
    console.error('Error playing sound:', error);
  }
}

/**
 * Play a repeated SOS alert
 * Useful for very urgent notifications
 */
export function playSOSAlert(volume: number = 0.5, repeatCount: number = 3): void {
  if (typeof window === 'undefined') return;

  let count = 0;
  const interval = setInterval(() => {
    playSound('sos', volume);
    count++;
    if (count >= repeatCount) {
      clearInterval(interval);
    }
  }, 600);
}

/**
 * Check if notifications are supported
 */
export function areNotificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!areNotificationsSupported()) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Show a browser notification
 */
export function showNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (typeof window === 'undefined') return;
  if (!areNotificationsSupported() || Notification.permission !== 'granted') {
    return;
  }

  try {
    new Notification(title, {
      ...options,
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}
