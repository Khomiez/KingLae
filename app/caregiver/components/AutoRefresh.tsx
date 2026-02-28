"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Auto-refresh component that subscribes to realtime changes
 * and refreshes the page when new urgent events occur
 */
export default function AutoRefresh() {
  const router = useRouter();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Subscribe to events changes
    const channel = supabase
      .channel('caregiver-home-events')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'events',
          filter: 'event_type=in.(SOS,ASSIST)' // Only urgent events
        },
        (payload) => {
          console.log('🔄 Realtime update:', payload);

          // Refresh the page when urgent events change
          // Only refresh if we're not currently typing or interacting
          router.refresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'devices'
        },
        (payload) => {
          console.log('🔄 Device state changed:', payload);
          // Refresh when device state changes (e.g., green button pressed)
          router.refresh();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Connected to realtime updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime connection error');
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [router]);

  return null; // This component doesn't render anything
}
