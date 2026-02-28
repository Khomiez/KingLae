import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

type Params = { params: Promise<{ id: string }> }

async function acknowledgeEvent(req: NextRequest, id: string) {
  const body = await req.json()
  const { caregiver_id } = body

  const supabase = createServerClient()

  // Verify event exists and is PENDING
  const { data: existing, error: fetchError } = await supabase
    .from('events')
    .select('status')
    .eq('id', id)
    .single()

  if (fetchError) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  if (existing.status !== 'PENDING') {
    return NextResponse.json({ error: `Cannot acknowledge event with status: ${existing.status}` }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('events')
    .update({
      status: 'ACKNOWLEDGED',
      acknowledged_by: caregiver_id ?? null,
      acknowledged_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update device state to reflect caregiver is on the way
  await supabase
    .from('devices')
    .update({ state: 'CAREGIVER_ON_THE_WAY' })
    .eq('mac_address', data.device_mac)

  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  return acknowledgeEvent(req, id)
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  return acknowledgeEvent(req, id)
}
