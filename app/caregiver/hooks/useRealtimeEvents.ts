"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { RealtimeChannel } from "@supabase/supabase-js";

type EventCallback = (payload: any) => void;
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'unavailable' | 'error';

export interface UseRealtimeEventsReturn {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  subscribeToEvents: (options: {
    eventTypes?: string[];
    statuses?: string[];
    onInsert?: EventCallback;
    onUpdate?: EventCallback;
    onDelete?: EventCallback;
    onStatusChange?: (status: ConnectionStatus) => void;
  }) => () => void;
  subscribeToDeviceChanges: (macAddress: string, callback: EventCallback) => () => void;
  subscribeToAllDevices: (callback: EventCallback) => () => void;
}

// Store callbacks globally to share across hook instances
const eventCallbacks = new Map<string, Set<EventCallback>>();
const deviceCallbacks = new Set<EventCallback>();

export function useRealtimeEvents(): UseRealtimeEventsReturn {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSetupRef = useRef(false);
  const statusCallbacksRef = useRef<Set<(status: ConnectionStatus) => void>>(new Set());

  // Update connection status and notify all listeners
  const updateConnectionStatus = useCallback((status: ConnectionStatus) => {
    console.log('📡 Connection status updated:', status);
    setConnectionStatus(status);
    setIsConnected(status === 'connected');
    statusCallbacksRef.current.forEach(callback => callback(status));
  }, []);

  // Setup shared channel (only once)
  useEffect(() => {
    if (isSetupRef.current) return; // Already setup
    isSetupRef.current = true;

    const channelName = `caregiver-realtime-${Date.now()}`;

    console.log('📡 Setting up shared realtime channel:', channelName);

    try {
      const channel = supabase.channel(channelName, {
        config: {
          presence: { key: '' },
        },
      });

      // Subscribe to events table changes
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        (payload) => {
          console.log('🔄 [Realtime] Event change received:', payload);
          const record = payload.new || payload.old;
          if (!record) return;

          // Notify all registered callbacks
          const callbacks = eventCallbacks.get(payload.eventType);
          if (callbacks) {
            callbacks.forEach(cb => {
              try {
                cb(payload);
              } catch (err) {
                console.error('Error in callback:', err);
              }
            });
          }
        }
      );

      // Subscribe to devices table changes
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'devices',
        },
        (payload) => {
          console.log('🔄 [Realtime] Device change received:', payload);
          deviceCallbacks.forEach(cb => {
            try {
              cb(payload);
            } catch (err) {
              console.error('Error in device callback:', err);
            }
          });
        }
      );

      // Subscribe with error handling
      channel.subscribe((status) => {
        console.log('📡 [Realtime] Channel status:', status);

        if (status === 'SUBSCRIBED') {
          console.log('✅ [Realtime] Successfully connected!');
          updateConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('⚠️ [Realtime] Channel error - Realtime may not be enabled for these tables');
          console.warn('⚠️ [Realtime] To enable: Go to Supabase Dashboard > Database > Replication > Enable Realtime for events and devices tables');
          // Don't set to error state - just show as unavailable
          updateConnectionStatus('unavailable');
        } else if (status === 'TIMED_OUT') {
          console.warn('⚠️ [Realtime] Connection timed out');
          updateConnectionStatus('unavailable');
        } else if (status === 'CLOSED') {
          updateConnectionStatus('disconnected');
        }
      });

      channelRef.current = channel;
    } catch (error) {
      console.error('❌ [Realtime] Failed to setup channel:', error);
      updateConnectionStatus('unavailable');
    }

    return () => {
      console.log('📡 [Realtime] Cleaning up shared channel');
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (err) {
          console.error('Error removing channel:', err);
        }
        channelRef.current = null;
      }
      isSetupRef.current = false;
    };
  }, [supabase, updateConnectionStatus]);

  const subscribeToEvents = useCallback((options: {
    eventTypes?: string[];
    statuses?: string[];
    onInsert?: EventCallback;
    onUpdate?: EventCallback;
    onDelete?: EventCallback;
    onStatusChange?: (status: ConnectionStatus) => void;
  }): (() => void) => {
    const {
      eventTypes,
      statuses,
      onInsert,
      onUpdate,
      onDelete,
      onStatusChange
    } = options;

    // Register status callback
    if (onStatusChange) {
      statusCallbacksRef.current.add(onStatusChange);
      onStatusChange(connectionStatus);
    }

    // Client-side filtering function
    const shouldProcessPayload = (payload: any): boolean => {
      const record = payload.new || payload.old;
      if (!record) return true;

      if (eventTypes && eventTypes.length > 0 && record.event_type) {
        if (!eventTypes.includes(record.event_type)) return false;
      }

      if (statuses && statuses.length > 0 && record.status) {
        if (!statuses.includes(record.status)) return false;
      }

      return true;
    };

    // Wrapper that applies filters
    const wrappedCallback = (payload: any) => {
      if (!shouldProcessPayload(payload)) return;

      if (payload.eventType === 'INSERT' && onInsert) {
        onInsert(payload);
      } else if (payload.eventType === 'UPDATE' && onUpdate) {
        onUpdate(payload);
      } else if (payload.eventType === 'DELETE' && onDelete) {
        onDelete(payload);
      }
    };

    // Register callbacks for each event type
    if (onInsert) {
      const eventType = 'INSERT';
      if (!eventCallbacks.has(eventType)) eventCallbacks.set(eventType, new Set());
      eventCallbacks.get(eventType)!.add(wrappedCallback);
    }

    if (onUpdate) {
      const eventType = 'UPDATE';
      if (!eventCallbacks.has(eventType)) eventCallbacks.set(eventType, new Set());
      eventCallbacks.get(eventType)!.add(wrappedCallback);
    }

    if (onDelete) {
      const eventType = 'DELETE';
      if (!eventCallbacks.has(eventType)) eventCallbacks.set(eventType, new Set());
      eventCallbacks.get(eventType)!.add(wrappedCallback);
    }

    console.log('📡 [Realtime] Registered event subscription:', { eventTypes, statuses });

    // Return unsubscribe function
    return () => {
      console.log('📡 [Realtime] Unregistering event subscription');
      if (onStatusChange) {
        statusCallbacksRef.current.delete(onStatusChange);
      }

      if (onInsert) {
        const callbacks = eventCallbacks.get('INSERT');
        if (callbacks) {
          callbacks.delete(wrappedCallback);
          if (callbacks.size === 0) eventCallbacks.delete('INSERT');
        }
      }

      if (onUpdate) {
        const callbacks = eventCallbacks.get('UPDATE');
        if (callbacks) {
          callbacks.delete(wrappedCallback);
          if (callbacks.size === 0) eventCallbacks.delete('UPDATE');
        }
      }

      if (onDelete) {
        const callbacks = eventCallbacks.get('DELETE');
        if (callbacks) {
          callbacks.delete(wrappedCallback);
          if (callbacks.size === 0) eventCallbacks.delete('DELETE');
        }
      }
    };
  }, [connectionStatus]);

  const subscribeToDeviceChanges = useCallback((
    macAddress: string,
    callback: EventCallback
  ): (() => void) => {
    const wrappedCallback = (payload: any) => {
      if (payload.new && payload.new.mac_address === macAddress) {
        callback(payload);
      }
    };

    deviceCallbacks.add(wrappedCallback);
    console.log('📡 [Realtime] Registered device subscription for:', macAddress);

    return () => {
      console.log('📡 [Realtime] Unregistered device subscription for:', macAddress);
      deviceCallbacks.delete(wrappedCallback);
    };
  }, []);

  const subscribeToAllDevices = useCallback((
    callback: EventCallback
  ): (() => void) => {
    deviceCallbacks.add(callback);
    console.log('📡 [Realtime] Registered all devices subscription');

    return () => {
      console.log('📡 [Realtime] Unregistered all devices subscription');
      deviceCallbacks.delete(callback);
    };
  }, []);

  return {
    isConnected,
    connectionStatus,
    subscribeToEvents,
    subscribeToDeviceChanges,
    subscribeToAllDevices,
  };
}
