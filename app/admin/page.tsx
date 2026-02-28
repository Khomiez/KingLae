'use client'

import { useEffect, useState } from 'react'
import { StatsCards } from '@/components/admin/StatsCards'
import { EventTypeChart } from '@/components/admin/EventTypeChart'
import { EventStatusChart } from '@/components/admin/EventStatusChart'
import { BatteryLevelChart } from '@/components/admin/BatteryLevelChart'
import { DeviceHealthChart } from '@/components/admin/DeviceHealthChart'
import { EventsTimelineChart } from '@/components/admin/EventsTimelineChart'
import { CaregiverPerformanceChart } from '@/components/admin/CaregiverPerformanceChart'
import { PatientAgeDistributionChart } from '@/components/admin/PatientAgeDistributionChart'
import { RecentPatientsList } from '@/components/admin/RecentPatientsList'
import { ActiveEventsPanel } from '@/components/admin/ActiveEventsPanel'
import { CaregiversList } from '@/components/admin/CaregiversList'
import { DevicesList } from '@/components/admin/DevicesList'
import { PatientsList } from '@/components/admin/PatientsList'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RefreshCw, Shield, Activity } from 'lucide-react'
import { toZonedTime, format } from 'date-fns-tz'

const THAILAND_TZ = 'Asia/Bangkok'

interface DashboardData {
  totalPatients: number
  totalCaregivers: number
  totalDevices: number
  totalEvents: number
  activeEmergencies: number
  offlineDevices: number
  completedCheckins: number
  batteryLevels: number[]
  deviceHealthDistribution: Record<string, number>
  eventTypes: Array<{ event_type: string }>
  eventStatuses: Array<{ status: string }>
  eventsTimeline: Array<{ created_at: string; event_type: string }>
  caregivers: Array<{
    id: string
    name: string
    resolvedEvents: number
    avgResponseTime: number
  }>
  patientAgeGroups: Record<string, number>
  recentPatients: Array<{
    id: string
    name: string
    created_at: string
    date_of_birth?: string
  }>
  // Full data arrays for admin panels
  activeEvents: Array<{
    id: string
    event_type: string
    status: 'PENDING' | 'ACKNOWLEDGED'
    created_at: string
    device_mac: string
    devices?: { patient_id: string; patients?: { id: string; name: string } }
    caregivers?: { id: string; name: string }
  }>
  fullCaregivers: Array<{
    id: string
    name: string
    phone?: string
    created_at: string
  }>
  fullDevices: Array<{
    mac_address: string
    health: string
    battery_level: number
    state: string
    patient_id: string
    patients?: { id: string; name: string }
  }>
  fullPatients: Array<{
    id: string
    name: string
    date_of_birth?: string
    weight?: number
    height?: number
    symptoms?: string[]
    address?: string
    relative_line_id?: string
  }>
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('events')

  const fetchData = async () => {
    try {
      const response = await fetch('/api/stats/dashboard')
      if (!response.ok) throw new Error('Failed to fetch dashboard data')
      const json = await response.json()
      console.log('Dashboard data:', json)
      setData(json)
      setError(null)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const testAPI = async () => {
    try {
      const response = await fetch('/api/stats/test')
      const data = await response.json()
      console.log('Test API response:', data)
      alert(`Test API: ${JSON.stringify(data, null, 2)}`)
    } catch (err) {
      alert(`Test API error: ${err}`)
    }
  }

  const debugAPI = async () => {
    try {
      const response = await fetch('/api/debug')
      const data = await response.json()
      console.log('Debug API response:', data)
      alert(`Debug Data:\n\nPatients: ${data.data.patients.count}\nCaregivers: ${data.data.caregivers.count}\nDevices: ${data.data.devices.count}\nEvents: ${data.data.events.count}\n\nCheck console for full data`)
    } catch (err) {
      alert(`Debug error: ${err}`)
    }
  }

  const handleAcknowledgeEvent = async (eventId: string, caregiverId: string) => {
    const response = await fetch(`/api/events/${eventId}/acknowledge`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caregiver_id: caregiverId })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to acknowledge event')
    }

    fetchData() // Refresh data
  }

  const handleResolveEvent = async (eventId: string, note?: string) => {
    const response = await fetch(`/api/events/${eventId}/resolve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caregiver_note: note })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to resolve event')
    }

    fetchData()
  }

  const handleCancelEvent = async (eventId: string) => {
    const response = await fetch(`/api/events/${eventId}/cancel`, {
      method: 'PATCH'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to cancel event')
    }

    fetchData()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-gray-900 dark:via-gray-900 dark:to-black">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-900"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
              </div>
              <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-gray-900 dark:via-gray-900 dark:to-black">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Activity className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-red-800 dark:text-red-400 mb-2">Error Loading Dashboard</h2>
              <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-gray-900 dark:via-gray-900 dark:to-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Local Health Authority Command Center
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Live</span>
              </div>
              <button
                onClick={testAPI}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm"
              >
                Test
              </button>
              <button
                onClick={debugAPI}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-xl hover:bg-amber-200 dark:hover:bg-amber-800 transition-all text-sm"
              >
                Debug
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="mb-8">
          <StatsCards
            totalPatients={data.totalPatients}
            totalCaregivers={data.totalCaregivers}
            totalDevices={data.totalDevices}
            totalEvents={data.totalEvents}
            activeEmergencies={data.activeEmergencies}
            offlineDevices={data.offlineDevices}
            completedCheckins={data.completedCheckins}
          />
        </div>

        {/* Section: Operational Alerts */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-gradient-to-b from-red-500 to-orange-500 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Operational Alerts</h2>
            {data.activeEvents.length > 0 && (
              <span className="px-2 py-1 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                {data.activeEvents.length} Active
              </span>
            )}
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full sm:w-auto mb-4">
              <TabsTrigger value="events">
                Active Events ({data.activeEvents.length})
              </TabsTrigger>
              <TabsTrigger value="caregivers">
                Caregivers ({data.fullCaregivers.length})
              </TabsTrigger>
              <TabsTrigger value="devices">
                Devices ({data.fullDevices.length})
              </TabsTrigger>
              <TabsTrigger value="patients">
                Patients ({data.fullPatients.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="events">
              <ActiveEventsPanel
                events={data.activeEvents}
                caregivers={data.fullCaregivers}
                onRefresh={fetchData}
                onAcknowledge={handleAcknowledgeEvent}
                onResolve={handleResolveEvent}
                onCancel={handleCancelEvent}
              />
            </TabsContent>

            <TabsContent value="caregivers">
              <CaregiversList caregivers={data.fullCaregivers} />
            </TabsContent>

            <TabsContent value="devices">
              <DevicesList devices={data.fullDevices} />
            </TabsContent>

            <TabsContent value="patients">
              <PatientsList patients={data.fullPatients} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Section: Events Trends & Timeline */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Events Timeline (Last 7 Days)</h2>
          </div>
          <EventsTimelineChart eventsTimeline={data.eventsTimeline} />
        </div>

        {/* Section: Event Analysis */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-gradient-to-b from-violet-500 to-purple-500 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Event Analysis</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EventTypeChart eventTypes={data.eventTypes} />
            <EventStatusChart eventStatuses={data.eventStatuses} />
          </div>
        </div>

        {/* Section: System Health */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">System Health</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DeviceHealthChart deviceHealthDistribution={data.deviceHealthDistribution} />
            <BatteryLevelChart batteryLevels={data.batteryLevels} />
          </div>
        </div>

        {/* Section: Performance Metrics */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Performance & Demographics</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CaregiverPerformanceChart caregivers={data.caregivers} />
            <PatientAgeDistributionChart patientAgeGroups={data.patientAgeGroups} />
          </div>
        </div>

        {/* Section: Recent Activity */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-gradient-to-b from-cyan-500 to-teal-500 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Recent Activity</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RecentPatientsList patients={data.recentPatients} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Shield className="w-4 h-4" />
              <span>KingLae Healthcare Platform • Admin Dashboard</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
              <span>Last updated: {format(toZonedTime(new Date(), THAILAND_TZ), 'PPp', { timeZone: THAILAND_TZ })} (TH)</span>
              <span>•</span>
              <span>Auto-refreshes every 30s</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
