"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { RealtimeChannel } from "@supabase/supabase-js";

type EventCallback = (payload: any) => void;

export function useRealtimeEvents() {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [channels, setChannels] = useState<RealtimeChannel[]>([]);

  useEffect(() => {
    // Clean up channels on unmount
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [supabase, channels]);

  const subscribeToEvents = (callbacks: {
    onInsert?: EventCallback;
    onUpdate?: EventCallback;
    onDelete?: EventCallback;
  }) => {
    const channel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        (payload) => {
          console.log('🔄 Realtime event change:', payload);
          if (payload.eventType === 'INSERT' && callbacks.onInsert) {
            callbacks.onInsert(payload);
          } else if (payload.eventType === 'UPDATE' && callbacks.onUpdate) {
            callbacks.onUpdate(payload);
          } else if (payload.eventType === 'DELETE' && callbacks.onDelete) {
            callbacks.onDelete(payload);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
      });

    setChannels(prev => [...prev, channel]);

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToDevices = (callbacks: {
    onUpdate?: EventCallback;
  }) => {
    const channel = supabase
      .channel('devices-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'devices'
        },
        (payload) => {
          console.log('🔄 Realtime device change:', payload);
          if (callbacks.onUpdate) {
            callbacks.onUpdate(payload);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
      });

    setChannels(prev => [...prev, channel]);

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return { subscribeToEvents, subscribeToDevices };
}
