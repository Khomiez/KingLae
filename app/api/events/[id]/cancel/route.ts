import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: existing, error: fetchError } = await supabase
    .from('events')
    .select('status, device_mac')
    .eq('id', id)
    .single()

  if (fetchError) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  if (existing.status === 'RESOLVED' || existing.status === 'CANCELLED') {
    return NextResponse.json({ error: `Cannot cancel event with status: ${existing.status}` }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('events')
    .update({ status: 'CANCELLED' })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Reset device state to IDLE on cancel
  await supabase
    .from('devices')
    .update({ state: 'IDLE' })
    .eq('mac_address', existing.device_mac)

  return NextResponse.json(data)
}
