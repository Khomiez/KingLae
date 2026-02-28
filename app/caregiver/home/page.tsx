import Link from "next/link";
import CaregiverNav from "../components/CaregiverNav";
import AcknowledgeButton from "../components/AcknowledgeButton";
import { createServerClient } from "@/lib/supabase-server";

async function getCaregiverData() {
  const supabase = createServerClient();

  // Get all patients first - simpler query
  const { data: patients, error: patientsError } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });

  console.log('=== DEBUG: Patients Query ===');
  console.log('Patients count:', patients?.length || 0);
  console.log('Patients error:', patientsError);
  console.log('Patients data:', patients);

  // Get devices for all patients
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
  const patientsWithDevices = (patients || []).map(patient => ({
    ...patient,
    devices: deviceMap.get(patient.id) ? [deviceMap.get(patient.id)] : null,
  }));

  // Get urgent events (SOS and ASSIST) - simpler query without inner joins
  const { data: urgentEvents, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .in('event_type', ['SOS', 'ASSIST'])
    .in('status', ['PENDING', 'ACKNOWLEDGED'])
    .order('created_at', { ascending: false })
    .limit(10);

  // For each event, fetch the related patient and device data
  const eventsWithRelations = await Promise.all(
    (urgentEvents || []).map(async (event) => {
      const { data: device } = await supabase
        .from('devices')
        .select('*')
        .eq('mac_address', event.device_mac)
        .single();

      const patientId = device?.patient_id;
      const { data: patient } = patientId ? await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single() : null;

      return {
        ...event,
        devices: device ? [device] : null,
        patients: patient,
      };
    })
  );

  return {
    urgentEvents: eventsWithRelations,
    patients: patientsWithDevices,
    patientsError,
    eventsError,
  };
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

export default async function CaregiverHomePage() {
  const { urgentEvents, patients, patientsError, eventsError } = await getCaregiverData();

  const sosEvents = urgentEvents.filter(e => e.event_type === 'SOS');
  const assistEvents = urgentEvents.filter(e => e.event_type === 'ASSIST');

  // Debug info display - remove this later
  const showDebug = patientsError || patients.length === 0;

  return (
    <div className="bg-[var(--medical-bg)] text-slate-800 min-h-screen relative pb-24">
      {/* Debug Banner - Remove in production */}
      {showDebug && (
        <div className="bg-yellow-100 border-b border-yellow-300 px-4 py-2 text-xs">
          <p><strong>Debug:</strong> Patients: {patients.length}, Error: {patientsError?.message || 'None'}</p>
          <p className="mt-1">Check terminal for "DEBUG: Patients Query" logs</p>
          <a href="/caregiver/test-db" className="text-blue-600 underline">Test DB Connection</a>
        </div>
      )}
      {/* Offline Banner */}
      <div className="hidden bg-slate-800 text-white text-xs py-2 px-4 text-center font-medium safe-area-top">
        <span className="material-symbols-outlined text-sm align-bottom mr-1">
          wifi_off
        </span>
        ออฟไลน์ - จะซิงก์ข้อมูลเมื่อเชื่อมต่อ
      </div>

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
            </div>
            <p className="text-slate-500 text-sm">
              {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-light">ยินดีต้อนรับ</p>
            <p className="text-sm font-semibold text-slate-700">พยาบาลประจำห้อง</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-8">
        {/* Urgent Tasks Section */}
        {urgentEvents.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--alert-red)]">
                  warning
                </span>
                งานด่วน ({urgentEvents.length})
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
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            bed
                          </span>
                          เตียง {event.patients?.bed_number || '-'} • {event.patients?.room_number || '-'}
                        </p>
                      </div>
                    </div>

                    {event.status === 'PENDING' && (
                      <div className="flex items-center justify-between bg-red-50 rounded-lg p-3 mb-4">
                        <div className="text-[var(--alert-red)] text-sm font-semibold">
                          รอการตอบรับ
                        </div>
                        <div className="text-[var(--alert-red)] font-bold font-mono">
                          {formatElapsedTime(event.created_at)}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Link
                        href={`/caregiver/patient-info?id=${event.devices?.patient_id}`}
                        className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-2"
                      >
                        <span className="material-symbols-outlined">person</span>
                        ดูข้อมูลผู้ป่วย
                      </Link>
                      {event.status === 'PENDING' ? (
                        <AcknowledgeButton
                          eventId={event.id}
                          redirectTo={`/caregiver/write-report?eventId=${event.id}`}
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
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            bed
                          </span>
                          เตียง {event.patients?.bed_number || '-'} • {event.patients?.room_number || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/caregiver/patient-info?id=${event.devices?.patient_id}`}
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
              {patientsError && (
                <p className="text-red-400 text-xs mt-2">Error: {patientsError.message}</p>
              )}
              <Link
                href="/caregiver/debug-db"
                className="text-blue-500 text-xs underline mt-2 inline-block"
              >
                ดูข้อมูลในฐานข้อมูล (Debug)
              </Link>
            </div>
          )}

          {/* Debug info - remove in production */}
          {patientsError && patients.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2 text-xs text-yellow-700">
              Warning: {patientsError.message}
            </div>
          )}
        </section>
      </main>

      {/* Bottom Navigation */}
      <CaregiverNav />
    </div>
  );
}
