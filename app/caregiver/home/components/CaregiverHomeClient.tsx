"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AcknowledgeButton from "../../components/AcknowledgeButton";
import CaregiverNav from "../../components/CaregiverNav";
import { useRealtimeEvents, UseRealtimeEventsReturn } from "../../hooks/useRealtimeEvents";
import { useEventNotificationsWithPrompt } from "../../hooks/useEventNotifications";
import EventNotification, { useShowNotification } from "../../components/EventNotification";
import { ConnectionIndicator } from "../../components/ConnectionStatus";
import { createBrowserClient } from "@supabase/ssr";

type EventData = {
  id: string;
  event_type: string;
  created_at: string;
  status: string;
  device_mac: string;
  devices?: {
    mac_address: string;
    patient_id: string;
    state: string;
    battery_level: number;
    health: string;
    last_seen_at: string;
  }[];
  patients?: {
    id: string;
    name: string;
  };
};

type PatientData = {
  id: string;
  name: string;
  symptoms?: string;
  date_of_birth?: string;
  weight?: number;
  height?: number;
  address?: string;
  devices?: {
    mac_address: string;
    patient_id: string;
    state: string;
    battery_level: number;
    health: string;
    last_seen_at: string;
  }[];
};

interface CaregiverHomeClientProps {
  initialUrgentEvents: EventData[];
  initialPatients: PatientData[];
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "เมื่อกี้";
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ชม.ที่แล้ว`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} วันที่แล้ว`;
}

function formatElapsedTime(dateString: string): string {
  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now.getTime() - then.getTime();
  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  const secs = Math.floor((diffMs % 60000) / 1000);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Live elapsed time component that updates every second
function LiveElapsedTime({ createdAt }: { createdAt: string }) {
  const [time, setTime] = useState(() => formatElapsedTime(createdAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(formatElapsedTime(createdAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return <>{time}</>;
}

export default function CaregiverHomeClient({
  initialUrgentEvents,
  initialPatients,
}: CaregiverHomeClientProps) {
  const [events, setEvents] = useState<EventData[]>(initialUrgentEvents);
  const [patients, setPatients] = useState<PatientData[]>(initialPatients);
  const { subscribeToEvents, subscribeToAllDevices, isConnected } = useRealtimeEvents();
  const { isMuted, toggleMute, notifyEvent } = useEventNotificationsWithPrompt();
  const { showNotification } = useShowNotification();
  const [elapsedTimes, setElapsedTimes] = useState<Record<string, string>>({});

  // Update elapsed times every second for PENDING events
  useEffect(() => {
    const interval = setInterval(() => {
      const pendingEvents = events.filter(e => e.status === 'PENDING');
      const newTimes: Record<string, string> = {};
      pendingEvents.forEach(event => {
        newTimes[event.id] = formatElapsedTime(event.created_at);
      });
      setElapsedTimes(prev => ({ ...prev, ...newTimes }));
    }, 1000);
    return () => clearInterval(interval);
  }, [events]);

  // Subscribe to urgent events (SOS, ASSIST)
  useEffect(() => {
    const unsubscribe = subscribeToEvents({
      eventTypes: ['SOS', 'ASSIST'],
      statuses: ['PENDING', 'ACKNOWLEDGED'],
      onInsert: (payload) => {
        console.log('📥 New urgent event:', payload);
        const newEvent = payload.new as EventData;

        // Fetch related patient data
        fetchEventWithRelations(newEvent.id).then(eventWithData => {
          if (eventWithData) {
            setEvents(prev => {
              // Check if event already exists
              if (prev.some(e => e.id === eventWithData.id)) {
                return prev;
              }
              // Add new event at the beginning
              return [eventWithData, ...prev];
            });

            // Trigger notification
            notifyEvent(newEvent.event_type, newEvent.patients?.name);
          }
        });
      },
      onUpdate: (payload) => {
        console.log('📝 Event updated:', payload);
        const updatedEvent = payload.new as EventData;

        if (updatedEvent.status === 'RESOLVED') {
          // Remove from urgent events list
          setEvents(prev => prev.filter(e => e.id !== updatedEvent.id));
        } else if (updatedEvent.status === 'ACKNOWLEDGED') {
          // Update the event in the list
          setEvents(prev => prev.map(e =>
            e.id === updatedEvent.id ? { ...e, status: updatedEvent.status } : e
          ));
        } else {
          // General update
          fetchEventWithRelations(updatedEvent.id).then(eventWithData => {
            if (eventWithData) {
              setEvents(prev => prev.map(e =>
                e.id === eventWithData.id ? eventWithData : e
              ));
            }
          });
        }
      },
    });

    return () => unsubscribe();
  }, [subscribeToEvents, notifyEvent]);

  // Polling fallback when Realtime is not available
  useEffect(() => {
    // Don't poll if Realtime is connected
    if (isConnected) {
      console.log('✅ Realtime is connected, skipping polling');
      return;
    }

    console.log('⚠️ Realtime not available, using polling fallback');

    // Poll for new events every 2 seconds
    const interval = setInterval(async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Fetch urgent events
      const { data: urgentEvents } = await supabase
        .from('events')
        .select('*')
        .in('event_type', ['SOS', 'ASSIST'])
        .in('status', ['PENDING', 'ACKNOWLEDGED'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (!urgentEvents) return;

      // Check for new events
      const currentEventIds = new Set(events.map(e => e.id));
      const newEvents = urgentEvents.filter(e => !currentEventIds.has(e.id));

      // Process new events
      for (const event of newEvents) {
        console.log('📥 [Polling] New event found:', event);
        const eventWithData = await fetchEventWithRelations(event.id);
        if (eventWithData) {
          setEvents(prev => {
            if (prev.some(e => e.id === eventWithData.id)) {
              return prev;
            }
            notifyEvent(eventWithData.event_type, eventWithData.patients?.name);
            return [eventWithData, ...prev];
          });
        }
      }

      // Check for removed events (status changed to RESOLVED)
      const fetchedIds = new Set(urgentEvents.map(e => e.id));
      setEvents(prev => prev.filter(e => fetchedIds.has(e.id) || e.status !== 'PENDING'));

      // Check for status changes
      for (const fetchedEvent of urgentEvents) {
        const existingEvent = events.find(e => e.id === fetchedEvent.id);
        if (existingEvent && existingEvent.status !== fetchedEvent.status) {
          console.log('📝 [Polling] Event status changed:', fetchedEvent.id, existingEvent.status, '->', fetchedEvent.status);
          setEvents(prev => prev.map(e =>
            e.id === fetchedEvent.id ? { ...e, status: fetchedEvent.status } : e
          ));
        }
      }

      // Fetch updated device data
      const { data: devices } = await supabase
        .from('devices')
        .select('*');

      if (devices) {
        setPatients(prev => prev.map(patient => {
          const device = devices.find(d => d.patient_id === patient.id);
          if (device) {
            return {
              ...patient,
              devices: [device],
            };
          }
          return patient;
        }));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isConnected, events, notifyEvent]);

  // Subscribe to device changes (for patient list status indicators)
  useEffect(() => {
    const unsubscribe = subscribeToAllDevices((payload) => {
      console.log('📱 Device changed:', payload);
      const updatedDevice = payload.new;

      // Update patient list with new device status
      setPatients(prev => prev.map(patient => {
        const hasDevice = patient.devices?.some(d => d.mac_address === updatedDevice.mac_address);
        if (hasDevice) {
          return {
            ...patient,
            devices: patient.devices?.map(d =>
              d.mac_address === updatedDevice.mac_address ? updatedDevice : d
            ),
          };
        }
        return patient;
      }));

      // Also update events if they reference this device
      setEvents(prev => prev.map(event => {
        if (event.device_mac === updatedDevice.mac_address) {
          return {
            ...event,
            devices: event.devices?.map(d =>
              d.mac_address === updatedDevice.mac_address ? updatedDevice : d
            ) || [updatedDevice],
          };
        }
        return event;
      }));
    });

    return () => unsubscribe();
  }, [subscribeToAllDevices]);

  // Helper function to fetch event with relations
  const fetchEventWithRelations = useCallback(async (eventId: string): Promise<EventData | null> => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (!event) return null;

    // Fetch device data
    const { data: device } = await supabase
      .from('devices')
      .select('mac_address, patient_id, state, battery_level, health, last_seen_at')
      .eq('mac_address', event.device_mac)
      .single();

    // Fetch patient data
    let patient = null;
    if (device?.patient_id) {
      const { data: patientData } = await supabase
        .from('patients')
        .select('id, name')
        .eq('id', device.patient_id)
        .single();
      patient = patientData;
    }

    return {
      ...event,
      devices: device ? [device] : undefined,
      patients: patient || undefined,
    };
  }, []);

  const sosEvents = events.filter(e => e.event_type === 'SOS');
  const assistEvents = events.filter(e => e.event_type === 'ASSIST');

  return (
    <div className="bg-[var(--medical-bg)] text-slate-800 min-h-screen relative pb-24">
      {/* Notification System */}
      <EventNotification />

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20 safe-area-top">
        <div className="px-5 py-4 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[var(--medical-blue)] text-3xl">
                monitor_heart
              </span>
              <h1 className="text-xl font-bold text-[var(--medical-blue)] tracking-tight">
                CareLink
              </h1>
              {/* Connection Indicator */}
              <ConnectionIndicator />
            </div>
            <p className="text-slate-500 text-sm">
              {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-light">ยินดีต้อนรับ</p>
            <p className="text-sm font-semibold text-slate-700">พยาบาลประจำห้อง</p>
            {/* Mute Toggle */}
            <button
              onClick={toggleMute}
              className="text-slate-400 hover:text-slate-600 mt-1"
              title={isMuted ? "เปิดเสียง" : "ปิดเสียง"}
            >
              <span className="material-symbols-outlined text-lg">
                {isMuted ? 'volume_off' : 'volume_up'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-8">
        {/* Urgent Tasks Section */}
        {events.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--alert-red)]">
                  warning
                </span>
                งานด่วน ({events.length})
              </h2>
              <span className="text-xs font-medium px-2 py-1 bg-red-50 text-red-600 rounded-full animate-pulse">
                ต้องการความช่วยเหลือทันที
              </span>
            </div>

            <div className="space-y-4">
              {/* SOS Events */}
              {sosEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-2xl shadow-sm border-l-4 border-[var(--alert-red)] overflow-hidden relative">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="inline-flex items-center gap-1 bg-red-100 text-[var(--alert-red)] text-xs font-bold px-2.5 py-1 rounded-md">
                        <span className="material-symbols-outlined text-sm filled">
                          emergency
                        </span>
                        ฉุกเฉิน SOS
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {formatTimeAgo(event.created_at)}
                      </span>
                    </div>

                    <div className="flex items-start gap-4 mb-4">
                      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-slate-400 text-2xl">
                          person
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {event.patients?.name || 'ผู้ป่วย'}
                        </h3>
                      </div>
                    </div>

                    {event.status === 'PENDING' && (
                      <div className="flex items-center justify-between bg-red-50 rounded-lg p-3 mb-4">
                        <div className="text-[var(--alert-red)] text-sm font-semibold">
                          รอการตอบรับ
                        </div>
                        <div className="text-[var(--alert-red)] font-bold font-mono">
                          <LiveElapsedTime createdAt={event.created_at} />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Link
                        href={`/caregiver/patient-info?id=${event.devices?.[0]?.patient_id}`}
                        className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-2"
                      >
                        <span className="material-symbols-outlined">person</span>
                        ดูข้อมูลผู้ป่วย
                      </Link>
                      {event.status === 'PENDING' ? (
                        <AcknowledgeButton
                          eventId={event.id}
                          redirectTo={`/caregiver/sos-assessment/${event.id}`}
                          className="flex-1 bg-[var(--alert-red)] hover:bg-red-600 active:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-red-200 transition-colors flex justify-center items-center gap-2"
                        />
                      ) : (
                        <Link
                          href={`/caregiver/write-report?eventId=${event.id}`}
                          className="flex-1 bg-[var(--alert-red)] hover:bg-red-600 active:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-red-200 transition-colors flex justify-center items-center gap-2"
                        >
                          <span className="material-symbols-outlined">check_circle</span>
                          บันทึกการดูแล
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* ASSIST Events */}
              {assistEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-2xl shadow-sm border-l-4 border-[var(--alert-yellow)] overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-md">
                        <span className="material-symbols-outlined text-sm">
                          pan_tool
                        </span>
                        ช่วยเหลือทั่วไป
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {formatTimeAgo(event.created_at)}
                      </span>
                    </div>

                    <div className="flex items-start gap-4 mb-4">
                      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-slate-400 text-2xl">
                          person_3
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {event.patients?.name || 'ผู้ป่วย'}
                        </h3>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/caregiver/patient-info?id=${event.devices?.[0]?.patient_id}`}
                        className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-2"
                      >
                        <span className="material-symbols-outlined">person</span>
                        ดูข้อมูลผู้ป่วย
                      </Link>
                      {event.status === 'PENDING' ? (
                        <AcknowledgeButton
                          eventId={event.id}
                          redirectTo={`/caregiver/to-confirm`}
                          className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-2"
                        />
                      ) : (
                        <Link
                          href={`/caregiver/write-report?eventId=${event.id}`}
                          className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-2"
                        >
                          บันทึกการดูแล
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Morning Check Section */}
        <section>
          <div className="flex items-center justify-between mb-4 mt-8">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--medical-blue)]">
                wb_sunny
              </span>
              รายชื่อผู้ป่วย ({patients.length})
            </h2>
            <span className="text-xs text-slate-500">ทั้งหมดในระบบ</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
            {patients.map((patient) => {
              const device = patient.devices?.[0];
              const isOnline = device?.health === 'ONLINE';
              const statusColor = isOnline ? 'bg-green-400' : 'bg-slate-300';

              return (
                <Link
                  key={patient.id}
                  href={`/caregiver/patient-info?id=${patient.id}`}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-blue-50 text-[var(--medical-blue)] flex items-center justify-center font-bold text-sm">
                        {patient.name?.charAt(0) || '?'}
                      </div>
                      <span className={`absolute bottom-0 right-0 h-3 w-3 ${statusColor} border-2 border-white rounded-full`}></span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {patient.name || 'ผู้ป่วยไม่ระบุชื่อ'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {patient.symptoms?.substring(0, 30) || 'ไม่ระบุอาการ'}
                        {patient.symptoms && patient.symptoms.length > 30 && '...'}
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-300">
                    chevron_right
                  </span>
                </Link>
              );
            })}
          </div>

          {patients.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">person_off</span>
              <p className="text-slate-500 mt-2">ไม่พบข้อมูลผู้ป่วย</p>
            </div>
          )}
        </section>
      </main>

      {/* Bottom Navigation */}
      <CaregiverNav />
    </div>
  );
}
