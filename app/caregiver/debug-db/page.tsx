import { createServerClient } from "@/lib/supabase-server";

export default async function DebugDbPage() {
  const supabase = createServerClient();

  // Check patients
  const { data: patients, error: patientsError } = await supabase
    .from('patients')
    .select('*');

  // Check devices
  const { data: devices, error: devicesError } = await supabase
    .from('devices')
    .select('*');

  // Check events
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*');

  // Check caregivers
  const { data: caregivers, error: caregiversError } = await supabase
    .from('caregivers')
    .select('*');

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-8">Database Debug</h1>

      <div className="space-y-8">
        {/* Patients */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">
            Patients ({patients?.length || 0})
            {patientsError && <span className="text-red-500 ml-2">Error: {patientsError.message}</span>}
          </h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto max-h-96 overflow-y-auto">
            {JSON.stringify(patients || patientsError, null, 2)}
          </pre>
        </section>

        {/* Devices */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">
            Devices ({devices?.length || 0})
            {devicesError && <span className="text-red-500 ml-2">Error: {devicesError.message}</span>}
          </h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto max-h-96 overflow-y-auto">
            {JSON.stringify(devices || devicesError, null, 2)}
          </pre>
        </section>

        {/* Events */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">
            Events ({events?.length || 0})
            {eventsError && <span className="text-red-500 ml-2">Error: {eventsError.message}</span>}
          </h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto max-h-96 overflow-y-auto">
            {JSON.stringify(events || eventsError, null, 2)}
          </pre>
        </section>

        {/* Caregivers */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">
            Caregivers ({caregivers?.length || 0})
            {caregiversError && <span className="text-red-500 ml-2">Error: {caregiversError.message}</span>}
          </h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto max-h-96 overflow-y-auto">
            {JSON.stringify(caregivers || caregiversError, null, 2)}
          </pre>
        </section>
      </div>

      <div className="mt-8">
        <a href="/caregiver/home" className="text-blue-600 underline">← Back to Home</a>
      </div>
    </div>
  );
}
