import CaregiverNav from "../components/CaregiverNav";
import AcknowledgeButton from "../components/AcknowledgeButton";
import { createServerClient } from "@/lib/supabase-server";
import CaregiverHomeClient from "./components/CaregiverHomeClient";

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
        .select('mac_address, patient_id, state, battery_level, health, last_seen_at')
        .eq('mac_address', event.device_mac)
        .single();

      const patientId = device?.patient_id;
      const { data: patient } = patientId ? await supabase
        .from('patients')
        .select('id, name, date_of_birth, weight, height, symptoms, address, relative_line_id')
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

export default async function CaregiverHomePage() {
  const { urgentEvents, patients, patientsError, eventsError } = await getCaregiverData();

  // Debug info display - remove this later
  const showDebug = patientsError || patients.length === 0;

  return (
    <>
      {/* Debug Banner - Remove in production */}
      {showDebug && (
        <div className="bg-yellow-100 border-b border-yellow-300 px-4 py-2 text-xs">
          <p><strong>Debug:</strong> Patients: {patients.length}, Error: {patientsError?.message || 'None'}</p>
          <p className="mt-1">Check terminal for "DEBUG: Patients Query" logs</p>
          <a href="/caregiver/test-db" className="text-blue-600 underline">Test DB Connection</a>
        </div>
      )}

      {/* Client component with real-time updates */}
      <CaregiverHomeClient
        initialUrgentEvents={urgentEvents}
        initialPatients={patients}
      />
    </>
  );
}
