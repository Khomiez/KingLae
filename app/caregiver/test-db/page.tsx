import { createServerClient } from "@/lib/supabase-server";

export default async function TestDbPage() {
  const supabase = createServerClient();

  // Test 1: Get all patients (no joins)
  const { data: simplePatients, error: simpleError } = await supabase
    .from('patients')
    .select('*');

  // Test 2: Try to get devices
  const { data: devices, error: devicesError } = await supabase
    .from('devices')
    .select('*')
    .limit(5);

  // Test 3: Try to get events
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .limit(5);

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-mono text-sm">
      <h1 className="text-2xl font-bold mb-4">Database Test Page</h1>

      {/* Patients Test */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="font-bold text-lg mb-2">Patients Query</h2>
        {simpleError ? (
          <p className="text-red-600 mb-2">Error: {simpleError.message}</p>
        ) : (
          <>
            <p className="mb-2">Count: {simplePatients?.length || 0}</p>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs max-h-96">
              {JSON.stringify(simplePatients, null, 2)}
            </pre>
          </>
        )}
      </div>

      {/* Devices Test */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="font-bold text-lg mb-2">Devices Query</h2>
        {devicesError ? (
          <p className="text-red-600 mb-2">Error: {devicesError.message}</p>
        ) : (
          <>
            <p className="mb-2">Count: {devices?.length || 0}</p>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs max-h-96">
              {JSON.stringify(devices, null, 2)}
            </pre>
          </>
        )}
      </div>

      {/* Events Test */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="font-bold text-lg mb-2">Events Query</h2>
        {eventsError ? (
          <p className="text-red-600 mb-2">Error: {eventsError.message}</p>
        ) : (
          <>
            <p className="mb-2">Count: {events?.length || 0}</p>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs max-h-96">
              {JSON.stringify(events, null, 2)}
            </pre>
          </>
        )}
      </div>

      {/* Environment Check */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="font-bold text-lg mb-2">Environment Variables</h2>
        <ul className="list-disc list-inside space-y-1">
          <li className={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}>
            SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set'}
          </li>
          <li className={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}>
            SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}
          </li>
          <li className={process.env.SUPABASE_SERVICE_ROLE_KEY ? 'text-green-600' : 'text-red-600'}>
            SERVICE_ROLE_KEY: {process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Not set'}
          </li>
        </ul>
      </div>

      <div className="mt-8">
        <a href="/caregiver/home" className="text-blue-600 underline">← Back to Home</a>
      </div>
    </div>
  );
}
