import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// Maps ESP32 button color → event type and device state
const BUTTON_MAP: Record<string, { event_type: string; device_state: string }> = {
  RED:    { event_type: 'SOS',            device_state: 'EMERGENCY' },
  YELLOW: { event_type: 'ASSIST',         device_state: 'ASSIST_REQUESTED' },
  GREEN:  { event_type: 'MORNING_WAKEUP', device_state: 'MORNING_WINDOW' },
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { mac_address, action, button_color, battery_level, timestamp } = body

  if (!mac_address) return NextResponse.json({ error: 'mac_address is required' }, { status: 400 })
  if (action !== 'BUTTON_PRESS') return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  if (!button_color) return NextResponse.json({ error: 'button_color is required' }, { status: 400 })

  const mapping = BUTTON_MAP[button_color.toUpperCase()]
  if (!mapping) {
    return NextResponse.json({ error: `Unknown button_color: ${button_color}` }, { status: 400 })
  }

  const supabase = createServerClient()

  // 1. Verify device exists
  const { data: device, error: deviceError } = await supabase
    .from('devices')
    .select('mac_address')
    .eq('mac_address', mac_address)
    .single()

  if (deviceError || !device) {
    return NextResponse.json({ error: `Device not found: ${mac_address}` }, { status: 404 })
  }

  // 2. Update device telemetry and state
  const last_seen_at = timestamp
    ? new Date(timestamp * 1000).toISOString()
    : new Date().toISOString()

  await supabase
    .from('devices')
    .update({
      battery_level: battery_level ?? undefined,
      last_seen_at,
      state: mapping.device_state,
      health: 'ONLINE',
    })
    .eq('mac_address', mac_address)

  // 3. Insert event record
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      device_mac: mac_address,
      event_type: mapping.event_type,
      status: 'PENDING',
    })
    .select()
    .single()

  if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 })

  return NextResponse.json(
    { message: 'Event created', event_id: event.id, event_type: mapping.event_type },
    { status: 201 }
  )
}
