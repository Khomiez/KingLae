import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('patients')
    .select('*, devices(mac_address, state, health, battery_level, last_seen_at)')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()
  const { name, date_of_birth, weight, height, symptoms, address, relative_line_id } = body

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('patients')
    .update({ name, date_of_birth, weight, height, symptoms, address, relative_line_id })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = createServerClient()
  const { error } = await supabase.from('patients').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
