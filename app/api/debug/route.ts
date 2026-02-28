import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createServerClient()

    // Get raw data from each table
    const [patientsResult, caregiversResult, devicesResult, eventsResult] = await Promise.all([
      supabase.from('patients').select('*').limit(3),
      supabase.from('caregivers').select('*').limit(3),
      supabase.from('devices').select('*').limit(3),
      supabase.from('events').select('*').limit(3)
    ])

    return NextResponse.json({
      success: true,
      data: {
        patients: {
          count: patientsResult.data?.length || 0,
          sample: patientsResult.data || []
        },
        caregivers: {
          count: caregiversResult.data?.length || 0,
          sample: caregiversResult.data || []
        },
        devices: {
          count: devicesResult.data?.length || 0,
          sample: devicesResult.data || []
        },
        events: {
          count: eventsResult.data?.length || 0,
          sample: eventsResult.data || []
        }
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
