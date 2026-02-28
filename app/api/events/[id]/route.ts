import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('events')
    .select('*, devices!inner(mac_address, patient_id, state), patients!inner(id, name, room_number, bed_number), caregivers(id, name, phone)')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}
