import Link from "next/link";
import CaregiverNav from "../components/CaregiverNav";
import { createServerClient } from "@/lib/supabase-server";

async function getAllEvents() {
  const supabase = createServerClient();

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  // Get all devices and patients to attach to events
  const { data: devices } = await supabase
    .from('devices')
    .select('*');

  const { data: patients } = await supabase
    .from('patients')
    .select('*');

  // Create maps for quick lookup
  const deviceMap = new Map((devices || []).map(d => [d.mac_address, d]));
  const patientMap = new Map((patients || []).map(p => [p.id, p]));

  // Attach patient and device info to events
  const eventsWithInfo = (events || []).map(event => ({
    ...event,
    device: deviceMap.get(event.device_mac),
    patient: deviceMap.get(event.device_mac)?.patient_id
      ? patientMap.get(deviceMap.get(event.device_mac).patient_id)
      : null,
  }));

  return eventsWithInfo;
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

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getEventIcon(eventType: string) {
  switch (eventType) {
    case 'MORNING_WAKEUP':
      return { icon: 'sunny', color: 'bg-blue-100 text-blue-600', label: 'ตื่นนอน' };
    case 'ASSIST':
      return { icon: 'accessibility_new', color: 'bg-yellow-100 text-yellow-600', label: 'ขอความช่วยเหลือ' };
    case 'SOS':
      return { icon: 'emergency_share', color: 'bg-red-100 text-red-600', label: 'ฉุกเฉิน' };
    case 'MISSED_CHECKIN':
      return { icon: 'event_busy', color: 'bg-orange-100 text-orange-600', label: 'ไม่ได้เช็คอิน' };
    default:
      return { icon: 'info', color: 'bg-slate-100 text-slate-600', label: eventType };
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'RESOLVED':
      return 'bg-green-50 text-green-600 border-green-100';
    case 'ACKNOWLEDGED':
      return 'bg-blue-50 text-blue-600 border-blue-100';
    case 'PENDING':
      return 'bg-red-50 text-red-600 border-red-100';
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-500 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

export default async function HistoryPage() {
  const events = await getAllEvents();

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-800">ประวัติเหตุการณ์</h1>
        </div>
      </header>

      <main className="px-4 py-6">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium whitespace-nowrap">
            ทั้งหมด
          </button>
          <button className="px-4 py-2 bg-white text-slate-600 rounded-full text-sm font-medium whitespace-nowrap border border-slate-200">
            ฉุกเฉิน
          </button>
          <button className="px-4 py-2 bg-white text-slate-600 rounded-full text-sm font-medium whitespace-nowrap border border-slate-200">
            ช่วยเหลือ
          </button>
          <button className="px-4 py-2 bg-white text-slate-600 rounded-full text-sm font-medium whitespace-nowrap border border-slate-200">
            เช็คอิน
          </button>
        </div>

        {/* Events list */}
        <div className="space-y-4">
          {events.length > 0 ? (
            events.map((event) => {
              const { icon, color, label } = getEventIcon(event.event_type);
              const statusBadge = getStatusBadge(event.status);

              return (
                <Link
                  key={event.id}
                  href={`/caregiver/patient-info?id=${event.device?.patient_id || ''}`}
                  className="bg-white rounded-2xl p-4 card-shadow border border-slate-100 block hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`${color} p-2 rounded-lg shrink-0`}>
                      <span className="material-symbols-outlined text-[20px]">
                        {icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">
                            {label}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {event.patient?.name || 'ผู้ป่วยไม่ระบุ'}
                          </p>
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                          {formatTimeAgo(event.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">
                        {formatDateTime(event.created_at)}
                      </p>
                      {event.caregiver_note && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded mb-2">
                          หมายเหตุ: {event.caregiver_note}
                        </p>
                      )}
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full border ${statusBadge}`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">history</span>
              <p className="text-slate-500 mt-2">ไม่มีประวัติเหตุการณ์</p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <CaregiverNav />
    </div>
  );
}
