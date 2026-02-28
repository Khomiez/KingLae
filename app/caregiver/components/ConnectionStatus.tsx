"use client";

import { useEffect, useState } from "react";
import { useRealtimeEvents } from "../hooks/useRealtimeEvents";

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error' | 'unavailable';

interface ConnectionStatusProps {
  // Position for the status indicator
  position?: 'header' | 'footer' | 'inline';
  // Show detailed status text
  showText?: boolean;
  // Custom class names
  className?: string;
}

/**
 * Connection status indicator for realtime updates
 * Shows the current state of the Supabase realtime connection
 */
export default function ConnectionStatus({
  position = 'header',
  showText = true,
  className = '',
}: ConnectionStatusProps) {
  const { connectionStatus, isConnected } = useRealtimeEvents();
  const [visible, setVisible] = useState(true);

  // Auto-hide when connected or unavailable for 3 seconds
  useEffect(() => {
    if (connectionStatus === 'connected' || connectionStatus === 'unavailable') {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setVisible(true);
    }
  }, [connectionStatus]);

  // Don't show anything if hidden and (connected or unavailable)
  if (!visible && (connectionStatus === 'connected' || connectionStatus === 'unavailable')) {
    return null;
  }

  const getStatusConfig = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return {
          icon: 'wifi',
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          text: 'เชื่อมต่อแล้ว',
          dotColor: 'bg-green-500',
          animate: false,
        };
      case 'connecting':
        return {
          icon: 'sync',
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          text: 'กำลังเชื่อมต่อ...',
          dotColor: 'bg-blue-500',
          animate: true,
        };
      case 'reconnecting':
        return {
          icon: 'sync',
          color: 'text-amber-500',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          text: 'กำลังเชื่อมต่อใหม่...',
          dotColor: 'bg-amber-500',
          animate: true,
        };
      case 'disconnected':
        return {
          icon: 'wifi_off',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          text: 'ไม่ได้เชื่อมต่อ',
          dotColor: 'bg-gray-400',
          animate: false,
        };
      case 'error':
        return {
          icon: 'error',
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          text: 'เชื่อมต่อล้มเหลว',
          dotColor: 'bg-red-500',
          animate: false,
        };
      case 'unavailable':
        return {
          icon: 'cloud_off',
          color: 'text-gray-400',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          text: 'Realtime ไม่พร้อมใช้งาน',
          dotColor: 'bg-gray-300',
          animate: false,
        };
      default:
        return {
          icon: 'help',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          text: 'ไม่ทราบสถานะ',
          dotColor: 'bg-gray-400',
          animate: false,
        };
    }
  };

  const config = getStatusConfig(connectionStatus);

  // Inline version (compact)
  if (position === 'inline') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} ${config.borderColor} border ${className}`}>
        <span className={`material-symbols-outlined text-sm ${config.color} ${config.animate ? 'animate-spin' : ''}`}>
          {config.icon}
        </span>
        {showText && (
          <span className={`text-xs font-medium ${config.color}`}>
            {config.text}
          </span>
        )}
      </div>
    );
  }

  // Header/Footer version (full width banner)
  return (
    <div
      className={`${config.bgColor} ${config.color} px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 shadow-sm z-10 ${className}`}
    >
      <span
        className={`material-symbols-outlined text-[1.2rem] ${config.animate ? 'animate-spin-slow' : ''}`}
      >
        {config.icon}
      </span>
      {showText && <span>{config.text}</span>}

      {/* Connection status dot */}
      <span className={`h-2 w-2 rounded-full ${config.dotColor} ${connectionStatus === 'connected' ? 'animate-pulse' : ''}`}></span>

      {/* Retry button for error states */}
      {(connectionStatus === 'error' || connectionStatus === 'disconnected') && (
        <button
          onClick={() => window.location.reload()}
          className="ml-2 text-xs underline hover:opacity-80"
        >
          ลองใหม่
        </button>
      )}
    </div>
  );
}

/**
 * Minimal connection indicator (just a dot)
 * Useful for placing in headers without taking much space
 */
export function ConnectionIndicator({ className = '' }: { className?: string }) {
  const { connectionStatus, isConnected } = useRealtimeEvents();
  const [visible, setVisible] = useState(false);

  // Show when not connected, auto-hide when connected
  useEffect(() => {
    if (!isConnected) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  if (!visible) return null;

  const getDotColor = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
      case 'reconnecting':
        return 'bg-blue-500 animate-pulse';
      case 'disconnected':
        return 'bg-gray-400';
      case 'error':
        return 'bg-red-500';
      case 'unavailable':
        return 'bg-gray-300';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`} title={connectionStatus}>
      <span className={`h-2.5 w-2.5 rounded-full ${getDotColor(connectionStatus)}`}></span>
    </div>
  );
}

/**
 * Offline banner that shows when connection is lost
 * Replaces the hidden "offline" banner in the home page
 */
export function OfflineBanner({ className = '' }: { className?: string }) {
  const { connectionStatus, isConnected } = useRealtimeEvents();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setShowBanner(connectionStatus === 'disconnected' || connectionStatus === 'error');
  }, [connectionStatus]);

  if (!showBanner) return null;

  return (
    <div className={`bg-slate-800 text-white text-xs py-2 px-4 text-center font-medium safe-area-top ${className}`}>
      <span className="material-symbols-outlined text-sm align-bottom mr-1">
        wifi_off
      </span>
      ออฟไลน์ - การอัปเดตแบบเรียลไทม์ถูกหยุดชั่วคราว
    </div>
  );
}
