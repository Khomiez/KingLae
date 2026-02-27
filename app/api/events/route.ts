import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const event_type = searchParams.get('event_type')
  const device_mac = searchParams.get('device_mac')

  const supabase = createServerClient()
  let query = supabase
    .from('events')
    .select('*, devices(mac_address, patient_id), caregivers(id, name)')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (event_type) query = query.eq('event_type', event_type)
  if (device_mac) query = query.eq('device_mac', device_mac)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { device_mac, event_type } = body

  if (!device_mac) return NextResponse.json({ error: 'device_mac is required' }, { status: 400 })
  if (!event_type) return NextResponse.json({ error: 'event_type is required' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('events')
    .insert({ device_mac, event_type, status: 'PENDING' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
