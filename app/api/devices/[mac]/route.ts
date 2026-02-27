import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

type Params = { params: Promise<{ mac: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { mac } = await params
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('devices')
    .select('*, patients(id, name, relative_line_id)')
    .eq('mac_address', mac)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { mac } = await params
  const body = await req.json()
  const { patient_id, battery_level, state, health, last_seen_at } = body

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('devices')
    .update({ patient_id, battery_level, state, health, last_seen_at })
    .eq('mac_address', mac)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { mac } = await params
  const supabase = createServerClient()
  const { error } = await supabase.from('devices').delete().eq('mac_address', mac)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
