import Link from "next/link";
import CaregiverNav from "../components/CaregiverNav";
import { createServerClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";

async function getPatient(id: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('patients')
    .select('*, devices(mac_address, state, health, battery_level, last_seen_at)')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data;
}

async function getPatientEvents(patientId: string) {
  const supabase = createServerClient();

  // First get the device for this patient
  const { data: device } = await supabase
    .from('devices')
    .select('mac_address')
    .eq('patient_id', patientId)
    .single();

  if (!device) return [];

  // Then get events for this device with caregiver notes
  const { data } = await supabase
    .from('events')
    .select('id, event_type, status, created_at, resolved_at, caregiver_note')
    .eq('device_mac', device.mac_address)
    .order('created_at', { ascending: false })
    .limit(10);

  return data || [];
}

async function getAllPatients() {
  const supabase = createServerClient();

  const { data: patients } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });

  // Get all devices
  const { data: devices } = await supabase
    .from('devices')
    .select('*');

  // Create a map of patient_id -> device
  const deviceMap = new Map();
  (devices || []).forEach(device => {
    if (device.patient_id) {
      deviceMap.set(device.patient_id, device);
    }
  });

  // Attach device data to patients
  return (patients || []).map(patient => ({
    ...patient,
    devices: deviceMap.get(patient.id) ? [deviceMap.get(patient.id)] : null,
  }));
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function formatThaiDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "เมื่อกี้";
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `เมื่อวาน ${formatTime(dateString)} น.`;
  return `${Math.floor(diffHours / 24)} วันที่แล้ว`;
}

export default async function PatientInfoPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  // If no ID provided, show list of all patients
  if (!id) {
    const patients = await getAllPatients();

    return (
      <div className="flex flex-col min-h-screen bg-[#f8fafc] pb-24">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-4 py-4">
            <h1 className="text-lg font-bold text-slate-800">รายชื่อผู้ป่วย</h1>
            <p className="text-xs text-slate-500 font-medium">Patients List</p>
          </div>
        </header>

        <main className="px-4 py-6">
          {patients.length > 0 ? (
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
                        <div className="h-10 w-10 rounded-full bg-blue-50 text-[var(--primary-blue)] flex items-center justify-center font-bold text-sm">
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
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">person_off</span>
              <p className="text-slate-500 mt-2">ไม่พบข้อมูลผู้ป่วย</p>
            </div>
          )}
        </main>

        <CaregiverNav />
      </div>
    );
  }

  const patient = await getPatient(id);
  if (!patient) {
    notFound();
  }

  const events = await getPatientEvents(id);
  const device = patient.devices?.[0];
  const isOnline = device?.health === 'ONLINE';
  const age = patient.date_of_birth ? calculateAge(patient.date_of_birth) : null;

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'MORNING_WAKEUP':
        return { icon: 'sunny', color: 'bg-blue-100 text-blue-600' };
      case 'ASSIST':
        return { icon: 'accessibility_new', color: 'bg-yellow-100 text-yellow-600' };
      case 'SOS':
        return { icon: 'emergency_share', color: 'bg-red-100 text-red-600' };
      default:
        return { icon: 'info', color: 'bg-slate-100 text-slate-600' };
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link
              href="/caregiver/home"
              className="text-slate-500 hover:text-slate-800"
            >
              <span className="material-symbols-outlined text-[28px]">
                arrow_back
              </span>
            </Link>
            <div>
              <h1 className="text-lg font-bold leading-tight text-slate-800">
                ข้อมูลผู้ป่วย
              </h1>
              <p className="text-xs text-slate-500 font-medium">Patient Profile</p>
            </div>
          </div>
          <button
            className="p-2 rounded-full bg-slate-50 text-[var(--primary-blue)] hover:bg-slate-100 transition-colors"
            title="Refresh Data"
          >
            <span className="material-symbols-outlined text-[24px]">refresh</span>
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 space-y-6 pb-24">
        {/* Patient Info Section */}
        <section className="bg-white rounded-2xl p-5 card-shadow border border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center shrink-0 text-blue-600">
              <span className="material-symbols-outlined text-[36px]">person</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-800">{patient.name}</h2>
              <p className="text-sm text-slate-500 mb-1">Patient ID: {id.slice(0, 8)}...</p>
              {age && (
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">
                    cake
                  </span>
                  <span>{age} ปี</span>
                </div>
              )}
            </div>
          </div>
          <hr className="my-4 border-slate-100" />
          <div className="space-y-3">
            {patient.symptoms && (
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  อาการ / Symptoms
                </h3>
                <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  {patient.symptoms}
                </p>
              </div>
            )}
            {patient.address && (
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  ที่อยู่ / Address
                </h3>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] text-slate-400 mt-0.5">
                    location_on
                  </span>
                  <p className="text-sm text-slate-700">{patient.address}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Device Status Section */}
        {device && (
          <section>
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-base font-bold text-slate-800">
                สถานะอุปกรณ์ (Device Status)
              </h3>
              <span className="text-xs font-medium text-slate-400">
                {device.last_seen_at ? formatTimeAgo(device.last_seen_at) : 'ไม่พบข้อมูล'}
              </span>
            </div>
            <div className={`bg-white rounded-2xl p-5 card-shadow border-l-4 ${isOnline ? 'border-green-500' : 'border-slate-300'} relative overflow-hidden`}>
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <span className="material-symbols-outlined text-[100px]">
                  router
                </span>
              </div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-slate-400 text-[20px]">
                      qr_code_2
                    </span>
                    <span className="text-sm font-mono text-slate-500">
                      {device.mac_address}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-800">
                    KingLae Bedside Unit
                  </h4>
                </div>
                <div className={`${isOnline ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'} px-2 py-1 rounded text-xs font-bold flex items-center gap-1`}>
                  {isOnline && (
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  )}
                  {isOnline ? 'ออนไลน์ (ONLINE)' : 'ออฟไลน์ (OFFLINE)'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1 text-slate-800 font-bold text-xl mb-1">
                    <span className="material-symbols-outlined text-green-600">
                      battery_5_bar
                    </span>
                    {device.battery_level ?? '-'}%
                  </div>
                  <span className="text-xs text-slate-500">แบตเตอรี่</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col items-center justify-center">
                  <div className="text-slate-800 font-bold text-xl mb-1">
                    {device.state ?? 'UNKNOWN'}
                  </div>
                  <span className="text-xs text-slate-500">สถานะปัจจุบัน</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Recent History Section */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-base font-bold text-slate-800">
              ประวัติล่าสุด (Recent History)
            </h3>
          </div>
          <div className="bg-white rounded-2xl card-shadow overflow-hidden">
            {events.length > 0 ? (
              events.map((event) => {
                const { icon, color } = getEventIcon(event.event_type);
                const statusBadge = event.status === 'COMPLETED'
                  ? 'bg-blue-50 text-blue-600 border-blue-100'
                  : event.status === 'RESOLVED'
                  ? 'bg-purple-50 text-purple-600 border-purple-100'
                  : event.status === 'ACKNOWLEDGED'
                  ? 'bg-yellow-50 text-yellow-600'
                  : event.status === 'CANCELLED'
                  ? 'bg-gray-50 text-gray-500 border-gray-100'
                  : 'bg-red-50 text-red-600 border-red-100';

                return (
                  <div key={event.id} className="p-4 border-b border-slate-100 flex items-start gap-3 last:border-b-0">
                    <div className={`${color} p-2 rounded-lg shrink-0`}>
                      <span className="material-symbols-outlined text-[20px]">
                        {icon}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-slate-800">
                          {event.event_type}
                        </h4>
                        <span className="text-xs text-slate-400">
                          {formatTimeAgo(event.created_at)}
                        </span>
                      </div>
                      {event.caregiver_note && (
                        <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded border border-slate-100">
                          📝 {event.caregiver_note}
                        </p>
                      )}
                      <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-medium rounded-full border ${statusBadge}`}>
                        {event.status === 'COMPLETED' ? 'เสร็จสิ้น' :
                         event.status === 'RESOLVED' ? 'เจ้าหน้าที่มาถึง' :
                         event.status === 'ACKNOWLEDGED' ? 'รับงานแล้ว' :
                         event.status === 'CANCELLED' ? 'ยกเลิก' :
                         event.status}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400">
                <span className="material-symbols-outlined text-3xl">history</span>
                <p className="text-sm mt-2">ไม่มีประวัติเหตุการณ์</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <CaregiverNav />
    </div>
  );
}
