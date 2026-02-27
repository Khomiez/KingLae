import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()
  const { caregiver_note } = body

  const supabase = createServerClient()

  // Verify event exists and is ACKNOWLEDGED
  const { data: existing, error: fetchError } = await supabase
    .from('events')
    .select('status, device_mac')
    .eq('id', id)
    .single()

  if (fetchError) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  if (existing.status !== 'ACKNOWLEDGED') {
    return NextResponse.json({ error: `Cannot resolve event with status: ${existing.status}` }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('events')
    .update({
      status: 'RESOLVED',
      resolved_at: new Date().toISOString(),
      caregiver_note: caregiver_note ?? null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Reset device state to IDLE
  await supabase
    .from('devices')
    .update({ state: 'IDLE' })
    .eq('mac_address', existing.device_mac)

  return NextResponse.json(data)
}
