import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, date_of_birth, weight, height, symptoms, address, relative_line_id } = body

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('patients')
    .insert({ name, date_of_birth, weight, height, symptoms, address, relative_line_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
