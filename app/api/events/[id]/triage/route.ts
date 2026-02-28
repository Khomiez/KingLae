import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

type Params = { params: Promise<{ id: string }> }

interface TriageRequestBody {
  decision: 'TRUE_SOS' | 'DOWNGRADED_TO_ASSIST'
  caregiver_note?: string
  caregiver_id: string
}

async function sendLineNotification(lineUserId: string, message: string) {
  const lineAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  console.log('📱 LINE CHANNEL ACCESS TOKEN exists:', !!lineAccessToken)
  if (!lineUserId || !lineAccessToken) {
    if (!lineAccessToken) console.warn('⚠️ LINE_CHANNEL_ACCESS_TOKEN is not set in .env');
    return;
  }

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineAccessToken}`
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{ type: 'text', text: message }]
      })
    });

    const result = await response.json();
    if (response.ok) {
      console.log(`📱 LINE Notification sent to ${lineUserId}`);
    } else {
      console.error('❌ LINE API Error:', result);
    }
  } catch (error: any) {
    console.error('❌ Failed to send LINE notification:', error.message);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body: TriageRequestBody = await req.json()
  const { decision, caregiver_note, caregiver_id } = body

  // Validate decision
  if (decision !== 'TRUE_SOS' && decision !== 'DOWNGRADED_TO_ASSIST') {
    return NextResponse.json(
      { error: 'Invalid decision. Must be TRUE_SOS or DOWNGRADED_TO_ASSIST' },
      { status: 400 }
    )
  }

  // Require caregiver_note for TRUE_SOS
  if (decision === 'TRUE_SOS' && !caregiver_note?.trim()) {
    return NextResponse.json(
      { error: 'Caregiver note is required when confirming a true SOS emergency' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  // Fetch event with device and patient info
  const { data: event, error: fetchError } = await supabase
    .from('events')
    .select(`
      *,
      devices(
        mac_address,
        state,
        patients(
          name,
          relative_line_id
        )
      )
    `)
    .eq('id', id)
    .single()

  if (fetchError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  // Check if already triaged
  if (event.triage_decision) {
    return NextResponse.json(
      { error: 'Event has already been triaged', event },
      { status: 409 }
    )
  }

  // Validate event type (only SOS can be triaged)
  if (event.event_type !== 'SOS') {
    return NextResponse.json(
      { error: 'Only SOS events can be triaged' },
      { status: 400 }
    )
  }

  // Validate event status (must be ACKNOWLEDGED)
  if (event.status !== 'ACKNOWLEDGED') {
    return NextResponse.json(
      { error: `Cannot triage event with status: ${event.status}. Event must be ACKNOWLEDGED.` },
      { status: 409 }
    )
  }

  const now = new Date().toISOString()
  let updateData: any = {
    triage_decision: decision,
    triage_by: caregiver_id,
    triage_at: now,
  }
  let deviceState: string | null = null
  let redirectUrl: string = ''
  let lineMessage = ''

  if (decision === 'TRUE_SOS') {
    // Confirm as true emergency - complete the event
    updateData.status = 'COMPLETED'
    updateData.resolved_at = now
    updateData.is_true_sos = true
    updateData.caregiver_note = caregiver_note
    deviceState = 'IDLE'
    redirectUrl = `/caregiver/home?completed=true&eventId=${id}`
    lineMessage = `✅ ยืนยันเหตุฉุกเฉินจริง (SOS)\nผู้ป่วย: ${event.devices?.patients?.name || 'ไม่ระบุชื่อ'}\nเจ้าหน้าที่: ${caregiver_note}\nเวลา: ${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}\n\nสถานะ: เหตุฉุกเฉินจริง ดำเนินการแล้ว`
  } else {
    // Downgrade to assist request
    updateData.event_type = 'ASSIST'
    updateData.caregiver_note = caregiver_note || null
    // Keep status as ACKNOWLEDGED, device state stays CAREGIVER_ON_THE_WAY
    redirectUrl = `/caregiver/to-confirm?eventId=${id}`
    lineMessage = `⚠️ ประเมินแล้วไม่รุนแรง\nผู้ป่วย: ${event.devices?.patients?.name || 'ไม่ระบุชื่อ'}\nเปลี่ยนเป็น: คำขอช่วยเหลือปกติ\nเวลา: ${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}\n\nเจ้าหน้าที่กำลังเดินทางไปหาผู้ป่วยครับ`
  }

  // Update event
  const { data: updatedEvent, error: updateError } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    console.error('Error updating event:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Update device state if needed
  if (deviceState) {
    await supabase
      .from('devices')
      .update({ state: deviceState })
      .eq('mac_address', event.device_mac)
  }

  // Send LINE notification
  const relativeLineId = event.devices?.patients?.relative_line_id
  if (relativeLineId) {
    console.log('📱 Sending triage LINE notification to:', relativeLineId)
    await sendLineNotification(relativeLineId, lineMessage)
  } else {
    console.warn('⚠️ No relative_line_id found, skipping LINE notification')
  }

  return NextResponse.json({
    event: updatedEvent,
    redirect: redirectUrl,
    message: decision === 'TRUE_SOS'
      ? 'Emergency confirmed and event completed'
      : 'Event downgraded to assistance request'
  })
}
