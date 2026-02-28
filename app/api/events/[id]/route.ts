import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      devices(
        mac_address,
        state,
        battery_level,
        health,
        patients(
          id,
          name,
          date_of_birth,
          weight,
          height,
          symptoms,
          address
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  return NextResponse.json(event)
}
