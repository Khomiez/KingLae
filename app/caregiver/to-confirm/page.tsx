"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CaregiverNav from "../components/CaregiverNav";
import { createBrowserClient } from "@supabase/ssr";

type EventData = {
  id: string;
  event_type: string;
  created_at: string;
  status: string;
  devices: {
    mac_address: string;
    patient_id: string;
    state: string;
  };
  patients: {
    id: string;
    name: string;
  };
};

export default function ToConfirmPage() {
  const router = useRouter();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    async function checkEventStatus() {
      console.log('🔍 Checking for ACKNOWLEDGED events...');

      // Query with nested patient data through devices
      const { data: acknowledgedEvent, error: ackError } = await supabase
        .from('events')
        .select('*, devices!inner(mac_address, patient_id, state, patients(id, name))')
        .eq('status', 'ACKNOWLEDGED')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('🔍 ACKNOWLEDGED query result:', acknowledgedEvent);
      console.log('🔍 ACKNOWLEDGED query error:', ackError);

      if (acknowledgedEvent) {
        // Transform data structure to match expected format
        const transformedEvent = {
          ...acknowledgedEvent,
          patients: acknowledgedEvent.devices?.patients,
        };
        setEvent(transformedEvent as any);
        setLoading(false);
        return;
      }

      // Check if event was RESOLVED (green button pressed)
      const { data: resolvedEvent } = await supabase
        .from('events')
        .select('id')
        .eq('status', 'RESOLVED')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (resolvedEvent) {
        // Redirect to write-report page
        router.push(`/caregiver/write-report?eventId=${resolvedEvent.id}`);
        return;
      }

      setLoading(false);
    }

    // Initial check
    checkEventStatus();

    // Poll every 2 seconds
    intervalId = setInterval(checkEventStatus, 2000);

    return () => clearInterval(intervalId);
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="bg-gray-50 h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="bg-gray-50 h-screen flex flex-col overflow-hidden max-w-md mx-auto shadow-2xl relative">
        <header className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center z-10">
          <h1 className="text-xl font-bold text-[var(--medical-blue-dark)] flex items-center gap-2">
            <span className="material-symbols-outlined text-3xl">medical_services</span>
            CareLink
          </h1>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 bg-white">
          <span className="material-symbols-outlined text-6xl text-green-500 mb-4">
            check_circle
          </span>
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            ไม่มีงานที่รอการยืนยัน
          </h3>
          <p className="text-[var(--text-secondary)] text-center mb-6">
            ขณะนี้ไม่มีเหตุการณ์ที่ต้องยืนยัน
          </p>
          <Link
            href="/caregiver/home"
            className="bg-[var(--primary-blue)] text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-600 transition-colors"
          >
            กลับหน้าหลัก
          </Link>
        </main>

        <CaregiverNav />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 h-screen flex flex-col overflow-hidden max-w-md mx-auto shadow-2xl relative">
      {/* Location Status Bar */}
      <div className="bg-[var(--status-green)] text-white px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 shadow-sm z-10">
        <span className="material-symbols-outlined text-[1.2rem] filled">
          location_on
        </span>
        อยู่ในพื้นที่บ้านผู้ป่วยแล้ว
      </div>

      {/* Header */}
      <header className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center z-10">
        <h1 className="text-xl font-bold text-[var(--medical-blue-dark)] flex items-center gap-2">
          <span className="material-symbols-outlined text-3xl">medical_services</span>
          CareLink
        </h1>
        <button className="text-gray-400 hover:text-[var(--medical-blue)]">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 py-6 overflow-y-auto bg-white">
        {/* Patient Info Card */}
        <div className="w-full bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 flex items-start gap-4">
          <div className="bg-blue-200 rounded-full p-2 text-[var(--medical-blue-dark)]">
            <span className="material-symbols-outlined text-3xl">person</span>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">ผู้ป่วย</p>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {event.patients?.name}
            </h2>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
            ยืนยันการเริ่มดูแล
          </h3>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            กรุณากด{" "}
            <span className="text-[var(--status-green)] font-bold">ปุ่มสีเขียว</span>{" "}
            บนตัวอุปกรณ์ที่ข้างเตียง
            <br />
            เพื่อยืนยันการเข้าปฏิบัติงาน
          </p>
        </div>

        {/* Device Visual */}
        <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
          <div className="w-40 h-56 bg-white border border-gray-200 rounded-[2rem] device-shadow flex flex-col items-center justify-between py-6 relative z-0">
            {/* Screen */}
            <div className="w-28 h-16 bg-gray-100 rounded-xl mb-4 flex items-center justify-center border border-gray-200">
              <span className="material-symbols-outlined text-gray-400">wifi</span>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 w-full items-center">
              <div className="w-12 h-6 bg-red-200 rounded-full border border-red-300"></div>
              <div className="w-12 h-6 bg-yellow-200 rounded-full border border-yellow-300"></div>
              <div className="w-14 h-14 bg-green-500 rounded-full border-4 border-green-200 glow-effect flex items-center justify-center cursor-pointer transform scale-110">
                <span className="material-symbols-outlined text-white text-2xl font-bold">
                  check
                </span>
              </div>
            </div>
          </div>

          {/* Animated circles */}
          <div className="absolute -z-10 w-64 h-64 border border-blue-100 rounded-full animate-[ping_3s_linear_infinite] opacity-50"></div>
          <div className="absolute -z-10 w-56 h-56 border border-blue-100 rounded-full animate-[ping_3s_linear_infinite_0.5s] opacity-60"></div>
        </div>

        {/* Waiting Status */}
        <div className="flex flex-col items-center justify-center gap-3 mb-8">
          <div className="flex items-center gap-2 text-[var(--medical-blue)] font-medium bg-blue-50 px-4 py-2 rounded-full animate-pulse">
            <span className="material-symbols-outlined text-xl spin-slow">
              sync
            </span>
            รอยืนยันจากอุปกรณ์...
          </div>
        </div>

        {/* Manual Confirmation Link */}
        <div className="mt-auto w-full text-center pb-4">
          <Link
            href={`/caregiver/write-report?eventId=${event.id}`}
            className="text-gray-400 text-sm underline hover:text-gray-600 transition-colors"
          >
            หากอุปกรณ์ขัดข้อง กดเพื่อยืนยันด้วยตนเอง
          </Link>
        </div>
      </main>

      {/* Bottom Navigation */}
      <CaregiverNav />
    </div>
  );
}
