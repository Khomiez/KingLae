import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

type Params = { params: Promise<{ id: string }> }

async function resolveEvent(req: NextRequest, id: string) {
  const body = await req.json()
  const { caregiver_note, notes } = body
  const finalNote = caregiver_note ?? notes ?? null

  const supabase = createServerClient()
  const { id } = await params
  const body = await req.json()
  const { caregiver_note } = body

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
      caregiver_note: finalNote,
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

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  return resolveEvent(req, id)
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  return resolveEvent(req, id)
}
