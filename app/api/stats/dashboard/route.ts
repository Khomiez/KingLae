import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

const THAILAND_TZ = 'Asia/Bangkok'

// Get start of day in Thailand timezone (returns ISO string for Supabase query)
function getStartOfDayInThailand() {
  const now = new Date()
  // Convert to Thailand time (UTC+7)
  const thailandTime = new Date(now.getTime() + (7 * 60 * 60 * 1000))
  thailandTime.setHours(0, 0, 0, 0)
  // Convert back to UTC for Supabase
  const utcTime = new Date(thailandTime.getTime() - (7 * 60 * 60 * 1000))
  return utcTime.toISOString()
}

// Get start of day 7 days ago in Thailand timezone
function getSevenDaysAgoInThailand() {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  // Convert to Thailand time (UTC+7)
  const thailandTime = new Date(sevenDaysAgo.getTime() + (7 * 60 * 60 * 1000))
  thailandTime.setHours(0, 0, 0, 0)
  // Convert back to UTC for Supabase
  const utcTime = new Date(thailandTime.getTime() - (7 * 60 * 60 * 1000))
  return utcTime.toISOString()
}

export async function GET() {
  try {
    const supabase = createServerClient()

    // Get all patients
    const { data: patients, count: totalPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact' })

    // Get all caregivers
    const { data: caregivers, count: totalCaregivers } = await supabase
      .from('caregivers')
      .select('id, name, phone, created_at', { count: 'exact' })

    // Get all devices with patient info
    const { data: devices, count: totalDevices } = await supabase
      .from('devices')
      .select('mac_address, health, battery_level, patient_id, patients(id, name)', { count: 'exact' })

    // Get active emergencies (PENDING or ACKNOWLEDGED events)
    const { count: activeEmergencies } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .in('status', ['PENDING', 'ACKNOWLEDGED'])

    // Get offline devices count
    const offlineDevices = devices?.filter(d => d.health !== 'ONLINE').length || 0

    // Get active events (PENDING or ACKNOWLEDGED)
    const { data: activeEvents } = await supabase
      .from('events')
      .select('*, devices(mac_address, patient_id, patients(id, name)), caregivers(id, name)')
      .in('status', ['PENDING', 'ACKNOWLEDGED'])
      .order('created_at', { ascending: false })

    // Get today's completed check-ins (using Thailand timezone)
    const startOfTodayInThailand = getStartOfDayInThailand()
    const { count: completedCheckins } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'MORNING_WAKEUP')
      .eq('status', 'RESOLVED')
      .gte('created_at', startOfTodayInThailand)

    // Get total events count
    const { count: totalEvents } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })

    // Get all events for distribution
    const { data: allEvents } = await supabase
      .from('events')
      .select('event_type, status, created_at')

    // Get events over time (last 7 days, using Thailand timezone)
    const sevenDaysAgoInThailand = getSevenDaysAgoInThailand()
    const { data: eventsTimeline } = await supabase
      .from('events')
      .select('created_at, event_type')
      .gte('created_at', sevenDaysAgoInThailand)
      .order('created_at', { ascending: true })

    // Get caregiver performance data
    const caregiverData = await Promise.all(
      (caregivers || []).map(async (caregiver) => {
        const { data: caregiverEvents } = await supabase
          .from('events')
          .select('status, created_at, acknowledged_at')
          .eq('acknowledged_by', caregiver.id)

        const resolvedCount = caregiverEvents?.filter(e => e.status === 'RESOLVED').length || 0

        // Calculate average response time (in minutes) from created_at to acknowledged_at
        const responseTimes = caregiverEvents
          ?.filter(e => e.acknowledged_at && e.created_at)
          .map(e => {
            const created = new Date(e.created_at).getTime()
            const acknowledged = new Date(e.acknowledged_at!).getTime()
            return Math.round((acknowledged - created) / (1000 * 60)) // Convert to minutes
          }) || []

        const avgResponseTime = responseTimes.length > 0
          ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
          : 0

        return {
          id: caregiver.id,
          name: caregiver.name,
          resolvedEvents: resolvedCount,
          avgResponseTime
        }
      })
    )

    // Get patient age distribution
    const patientAgeGroups = (patients || []).reduce((acc, patient) => {
      if (patient.date_of_birth) {
        const age = new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
        if (age < 60) acc['< 60'] = (acc['< 60'] || 0) + 1
        else if (age < 70) acc['60-69'] = (acc['60-69'] || 0) + 1
        else if (age < 80) acc['70-79'] = (acc['70-79'] || 0) + 1
        else acc['80+'] = (acc['80+'] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    // Get battery levels
    const batteryLevels = devices?.map(d => d.battery_level).filter(Boolean) || []

    // Get device health distribution
    const deviceHealthDistribution = devices?.reduce((acc, d) => {
      acc[d.health] = (acc[d.health] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Get recent patients
    const recentPatients = (patients || [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)

    // Prepare event types and statuses from all events
    const eventTypes = (allEvents || []).map(e => ({ event_type: e.event_type }))
    const eventStatuses = (allEvents || []).map(e => ({ status: e.status }))

    return NextResponse.json({
      totalPatients: totalPatients || 0,
      totalCaregivers: totalCaregivers || 0,
      totalDevices: totalDevices || 0,
      totalEvents: totalEvents || 0,
      activeEmergencies: activeEmergencies || 0,
      offlineDevices: offlineDevices || 0,
      completedCheckins: completedCheckins || 0,
      batteryLevels,
      deviceHealthDistribution,
      eventTypes,
      eventStatuses,
      eventsTimeline: eventsTimeline || [],
      caregivers: caregiverData,
      patientAgeGroups,
      recentPatients,
      // Full data arrays for admin panels
      activeEvents: activeEvents || [],
      fullCaregivers: caregivers || [],
      fullDevices: devices || [],
      fullPatients: patients || [],
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
