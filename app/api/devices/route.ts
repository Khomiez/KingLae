import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('devices')
    .select('*, patients(id, name)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { mac_address, patient_id, battery_level, state, health } = body

  if (!mac_address) return NextResponse.json({ error: 'mac_address is required' }, { status: 400 })
  if (!patient_id) return NextResponse.json({ error: 'patient_id is required' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('devices')
    .insert({ mac_address, patient_id, battery_level, state, health })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
