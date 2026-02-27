'use client';

import { useState } from 'react';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface PathParam {
  key: string;
  placeholder: string;
}

interface QueryParam {
  key: string;
  placeholder: string;
}

interface BodyField {
  key: string;
  label: string;
  placeholder: string;
  type?: string;
}

interface EndpointDef {
  label: string;
  method: Method;
  buildPath: (params: Record<string, string>) => string;
  pathParams?: PathParam[];
  queryParams?: QueryParam[];
  bodyFields?: BodyField[];
}

interface EndpointGroup {
  name: string;
  endpoints: EndpointDef[];
}

const ENDPOINT_GROUPS: EndpointGroup[] = [
  {
    name: 'Caregivers',
    endpoints: [
      {
        label: 'GET list',
        method: 'GET',
        buildPath: () => '/api/caregivers',
      },
      {
        label: 'POST create',
        method: 'POST',
        buildPath: () => '/api/caregivers',
        bodyFields: [
          { key: 'name', label: 'Name', placeholder: 'John Doe' },
          { key: 'phone', label: 'Phone', placeholder: '+66812345678' },
        ],
      },
      {
        label: 'GET by ID',
        method: 'GET',
        buildPath: (p) => `/api/caregivers/${p.id}`,
        pathParams: [{ key: 'id', placeholder: 'caregiver-uuid' }],
      },
      {
        label: 'PUT update',
        method: 'PUT',
        buildPath: (p) => `/api/caregivers/${p.id}`,
        pathParams: [{ key: 'id', placeholder: 'caregiver-uuid' }],
        bodyFields: [
          { key: 'name', label: 'Name', placeholder: 'John Doe' },
          { key: 'phone', label: 'Phone', placeholder: '+66812345678' },
        ],
      },
      {
        label: 'DELETE',
        method: 'DELETE',
        buildPath: (p) => `/api/caregivers/${p.id}`,
        pathParams: [{ key: 'id', placeholder: 'caregiver-uuid' }],
      },
    ],
  },
  {
    name: 'Patients',
    endpoints: [
      {
        label: 'GET list',
        method: 'GET',
        buildPath: () => '/api/patients',
      },
      {
        label: 'POST create',
        method: 'POST',
        buildPath: () => '/api/patients',
        bodyFields: [
          { key: 'name', label: 'Name', placeholder: 'Jane Doe' },
          { key: 'date_of_birth', label: 'Date of Birth', placeholder: '1990-01-15', type: 'date' },
          { key: 'weight', label: 'Weight (kg)', placeholder: '60', type: 'number' },
          { key: 'height', label: 'Height (cm)', placeholder: '165', type: 'number' },
          { key: 'symptoms', label: 'Symptoms', placeholder: 'chest pain, shortness of breath' },
          { key: 'address', label: 'Address', placeholder: '123 Main St, Bangkok' },
          { key: 'relative_line_id', label: 'Relative LINE ID', placeholder: 'U1234567890abcdef' },
        ],
      },
      {
        label: 'GET by ID',
        method: 'GET',
        buildPath: (p) => `/api/patients/${p.id}`,
        pathParams: [{ key: 'id', placeholder: 'patient-uuid' }],
      },
      {
        label: 'PUT update',
        method: 'PUT',
        buildPath: (p) => `/api/patients/${p.id}`,
        pathParams: [{ key: 'id', placeholder: 'patient-uuid' }],
        bodyFields: [
          { key: 'name', label: 'Name', placeholder: 'Jane Doe' },
          { key: 'date_of_birth', label: 'Date of Birth', placeholder: '1990-01-15', type: 'date' },
          { key: 'weight', label: 'Weight (kg)', placeholder: '60', type: 'number' },
          { key: 'height', label: 'Height (cm)', placeholder: '165', type: 'number' },
          { key: 'symptoms', label: 'Symptoms', placeholder: 'chest pain, shortness of breath' },
          { key: 'address', label: 'Address', placeholder: '123 Main St, Bangkok' },
          { key: 'relative_line_id', label: 'Relative LINE ID', placeholder: 'U1234567890abcdef' },
        ],
      },
      {
        label: 'DELETE',
        method: 'DELETE',
        buildPath: (p) => `/api/patients/${p.id}`,
        pathParams: [{ key: 'id', placeholder: 'patient-uuid' }],
      },
    ],
  },
  {
    name: 'Devices',
    endpoints: [
      {
        label: 'GET list',
        method: 'GET',
        buildPath: () => '/api/devices',
      },
      {
        label: 'POST create',
        method: 'POST',
        buildPath: () => '/api/devices',
        bodyFields: [
          { key: 'mac_address', label: 'MAC Address', placeholder: 'AA:BB:CC:DD:EE:FF' },
          { key: 'patient_id', label: 'Patient ID', placeholder: 'patient-uuid' },
          { key: 'battery_level', label: 'Battery Level (%)', placeholder: '85', type: 'number' },
          { key: 'state', label: 'State', placeholder: 'active' },
          { key: 'health', label: 'Health', placeholder: 'good' },
        ],
      },
      {
        label: 'GET by MAC',
        method: 'GET',
        buildPath: (p) => `/api/devices/${p.mac}`,
        pathParams: [{ key: 'mac', placeholder: 'AA:BB:CC:DD:EE:FF' }],
      },
      {
        label: 'PUT update',
        method: 'PUT',
        buildPath: (p) => `/api/devices/${p.mac}`,
        pathParams: [{ key: 'mac', placeholder: 'AA:BB:CC:DD:EE:FF' }],
        bodyFields: [
          { key: 'patient_id', label: 'Patient ID', placeholder: 'patient-uuid' },
          { key: 'battery_level', label: 'Battery Level (%)', placeholder: '85', type: 'number' },
          { key: 'state', label: 'State', placeholder: 'active' },
          { key: 'health', label: 'Health', placeholder: 'good' },
          { key: 'last_seen_at', label: 'Last Seen At', placeholder: '2024-01-15T10:30:00Z' },
        ],
      },
      {
        label: 'DELETE',
        method: 'DELETE',
        buildPath: (p) => `/api/devices/${p.mac}`,
        pathParams: [{ key: 'mac', placeholder: 'AA:BB:CC:DD:EE:FF' }],
      },
    ],
  },
  {
    name: 'Events',
    endpoints: [
      {
        label: 'GET list',
        method: 'GET',
        buildPath: () => '/api/events',
        queryParams: [
          { key: 'status', placeholder: 'pending' },
          { key: 'event_type', placeholder: 'fall' },
          { key: 'device_mac', placeholder: 'AA:BB:CC:DD:EE:FF' },
        ],
      },
      {
        label: 'POST create',
        method: 'POST',
        buildPath: () => '/api/events',
        bodyFields: [
          { key: 'device_mac', label: 'Device MAC', placeholder: 'AA:BB:CC:DD:EE:FF' },
          { key: 'event_type', label: 'Event Type', placeholder: 'fall' },
        ],
      },
      {
        label: 'GET by ID',
        method: 'GET',
        buildPath: (p) => `/api/events/${p.id}`,
        pathParams: [{ key: 'id', placeholder: 'event-uuid' }],
      },
      {
        label: 'PATCH acknowledge',
        method: 'PATCH',
        buildPath: (p) => `/api/events/${p.id}/acknowledge`,
        pathParams: [{ key: 'id', placeholder: 'event-uuid' }],
        bodyFields: [
          { key: 'caregiver_id', label: 'Caregiver ID', placeholder: 'caregiver-uuid' },
        ],
      },
      {
        label: 'PATCH resolve',
        method: 'PATCH',
        buildPath: (p) => `/api/events/${p.id}/resolve`,
        pathParams: [{ key: 'id', placeholder: 'event-uuid' }],
        bodyFields: [
          { key: 'caregiver_note', label: 'Caregiver Note', placeholder: 'Patient is stable' },
        ],
      },
      {
        label: 'PATCH cancel',
        method: 'PATCH',
        buildPath: (p) => `/api/events/${p.id}/cancel`,
        pathParams: [{ key: 'id', placeholder: 'event-uuid' }],
      },
    ],
  },
  {
    name: 'MQTT',
    endpoints: [
      {
        label: 'POST event',
        method: 'POST',
        buildPath: () => '/api/mqtt/event',
        bodyFields: [
          { key: 'mac_address', label: 'MAC Address', placeholder: 'AA:BB:CC:DD:EE:FF' },
          { key: 'action', label: 'Action', placeholder: 'button_press' },
          { key: 'button_color', label: 'Button Color', placeholder: 'red' },
          { key: 'battery_level', label: 'Battery Level (%)', placeholder: '85', type: 'number' },
          { key: 'timestamp', label: 'Timestamp', placeholder: '2024-01-15T10:30:00Z' },
        ],
      },
    ],
  },
];

const METHOD_COLORS: Record<Method, string> = {
  GET: 'bg-blue-100 text-blue-700',
  POST: 'bg-green-100 text-green-700',
  PUT: 'bg-amber-100 text-amber-700',
  PATCH: 'bg-purple-100 text-purple-700',
  DELETE: 'bg-red-100 text-red-700',
};

async function callApi(
  method: Method,
  url: string,
  body?: Record<string, string>
): Promise<{ status: number; data: unknown }> {
  const options: RequestInit = {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
  };

  if (body && method !== 'GET' && method !== 'DELETE') {
    // Filter out empty strings and convert numeric strings
    const cleanedBody: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      if (v !== '') cleanedBody[k] = v;
    }
    options.body = JSON.stringify(cleanedBody);
  }

  try {
    const res = await fetch(url, options);
    let data: unknown;
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }
    return { status: res.status, data };
  } catch (err) {
    return { status: 0, data: { error: String(err) } };
  }
}

function MethodBadge({ method }: { method: Method }) {
  return (
    <span className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${METHOD_COLORS[method]}`}>
      {method}
    </span>
  );
}

interface SidebarProps {
  selected: { groupIdx: number; endpointIdx: number } | null;
  onSelect: (groupIdx: number, endpointIdx: number) => void;
}

function Sidebar({ selected, onSelect }: SidebarProps) {
  return (
    <aside className="w-56 shrink-0 bg-gray-50 border-r border-gray-200 overflow-y-auto">
      <div className="p-3">
        {ENDPOINT_GROUPS.map((group, gi) => (
          <div key={group.name} className="mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">
              {group.name}
            </p>
            <ul className="space-y-0.5">
              {group.endpoints.map((ep, ei) => {
                const isSelected = selected?.groupIdx === gi && selected?.endpointIdx === ei;
                return (
                  <li key={ei}>
                    <button
                      onClick={() => onSelect(gi, ei)}
                      className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 transition-colors ${
                        isSelected
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <MethodBadge method={ep.method} />
                      <span className="truncate">{ep.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}

interface ResponseState {
  status: number;
  data: unknown;
}

interface DetailPanelProps {
  endpoint: EndpointDef;
}

function DetailPanel({ endpoint }: DetailPanelProps) {
  const [pathValues, setPathValues] = useState<Record<string, string>>({});
  const [queryValues, setQueryValues] = useState<Record<string, string>>({});
  const [bodyValues, setBodyValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ResponseState | null>(null);

  const builtPath = (() => {
    try {
      return endpoint.buildPath(pathValues);
    } catch {
      return endpoint.buildPath({});
    }
  })();

  const fullUrl = (() => {
    const queryString = endpoint.queryParams
      ?.map((q) => queryValues[q.key] ? `${q.key}=${encodeURIComponent(queryValues[q.key])}` : '')
      .filter(Boolean)
      .join('&');
    return queryString ? `${builtPath}?${queryString}` : builtPath;
  })();

  async function handleSend() {
    setLoading(true);
    setResponse(null);
    const result = await callApi(
      endpoint.method,
      fullUrl,
      endpoint.bodyFields ? bodyValues : undefined
    );
    setResponse(result);
    setLoading(false);
  }

  const statusOk = response && response.status >= 200 && response.status < 300;

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-3xl">
      {/* Endpoint header */}
      <div className="flex items-center gap-3 mb-6">
        <MethodBadge method={endpoint.method} />
        <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded font-mono">
          {fullUrl}
        </code>
      </div>

      <div className="space-y-6">
        {/* Path params */}
        {endpoint.pathParams && endpoint.pathParams.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Path Parameters
            </h3>
            <div className="space-y-2">
              {endpoint.pathParams.map((p) => (
                <div key={p.key} className="flex items-center gap-3">
                  <label className="w-28 text-sm font-mono text-gray-600 shrink-0">{p.key}</label>
                  <input
                    type="text"
                    value={pathValues[p.key] ?? ''}
                    onChange={(e) =>
                      setPathValues((prev) => ({ ...prev, [p.key]: e.target.value }))
                    }
                    placeholder={p.placeholder}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Query params */}
        {endpoint.queryParams && endpoint.queryParams.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Query Parameters
            </h3>
            <div className="space-y-2">
              {endpoint.queryParams.map((q) => (
                <div key={q.key} className="flex items-center gap-3">
                  <label className="w-28 text-sm font-mono text-gray-600 shrink-0">{q.key}</label>
                  <input
                    type="text"
                    value={queryValues[q.key] ?? ''}
                    onChange={(e) =>
                      setQueryValues((prev) => ({ ...prev, [q.key]: e.target.value }))
                    }
                    placeholder={q.placeholder}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Body fields */}
        {endpoint.bodyFields && endpoint.bodyFields.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Request Body
            </h3>
            <div className="space-y-2">
              {endpoint.bodyFields.map((f) => (
                <div key={f.key} className="flex items-center gap-3">
                  <label className="w-28 text-sm text-gray-600 shrink-0">{f.label}</label>
                  <input
                    type={f.type ?? 'text'}
                    value={bodyValues[f.key] ?? ''}
                    onChange={(e) =>
                      setBodyValues((prev) => ({ ...prev, [f.key]: e.target.value }))
                    }
                    placeholder={f.placeholder}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={loading}
          className="px-5 py-2 bg-gray-800 text-white rounded text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {loading ? 'Sending…' : 'Send'}
        </button>

        {/* Response */}
        {response && (
          <section>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Response
              </h3>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  statusOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {response.status === 0 ? 'Network Error' : response.status}
              </span>
            </div>
            <pre className="bg-gray-900 text-green-400 text-xs rounded p-4 overflow-x-auto whitespace-pre-wrap break-words">
              {JSON.stringify(response.data, null, 2)}
            </pre>
          </section>
        )}
      </div>
    </div>
  );
}

export default function ApiTestPage() {
  const [selected, setSelected] = useState<{ groupIdx: number; endpointIdx: number } | null>(null);

  const selectedEndpoint =
    selected !== null
      ? ENDPOINT_GROUPS[selected.groupIdx].endpoints[selected.endpointIdx]
      : null;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="shrink-0 bg-gray-800 text-white px-6 py-3 flex items-center">
        <h1 className="text-lg font-semibold tracking-tight">KingLae API Tester</h1>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar selected={selected} onSelect={(gi, ei) => setSelected({ groupIdx: gi, endpointIdx: ei })} />

        <main className="flex-1 overflow-y-auto">
          {selectedEndpoint ? (
            <DetailPanel key={`${selected!.groupIdx}-${selected!.endpointIdx}`} endpoint={selectedEndpoint} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Select an endpoint from the sidebar
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
