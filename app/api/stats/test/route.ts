import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createServerClient()

    // Simple test - get counts
    const [patients, caregivers, devices, events] = await Promise.all([
      supabase.from('patients').select('id', { count: 'exact', head: true }),
      supabase.from('caregivers').select('id', { count: 'exact', head: true }),
      supabase.from('devices').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true })
    ])

    return NextResponse.json({
      patients: patients.count,
      caregivers: caregivers.count,
      devices: devices.count,
      events: events.count,
      message: 'API is working!'
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
