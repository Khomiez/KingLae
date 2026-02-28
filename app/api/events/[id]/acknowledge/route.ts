import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

type Params = { params: Promise<{ id: string }> }

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

async function acknowledgeEvent(req: NextRequest, id: string) {
  const body = await req.json()
  const { caregiver_id } = body

  const supabase = createServerClient()

  // Verify event exists and is PENDING, and fetch patient info
  const { data: existing, error: fetchError } = await supabase
    .from('events')
    .select('status, device_mac')
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

  // Fetch patient info to send LINE notification
  const { data: deviceData, error: deviceError } = await supabase
    .from('devices')
    .select('patients(name, relative_line_id)')
    .eq('mac_address', data.device_mac)
    .single()

  console.log('📱 Acknowledge - deviceData:', deviceData)
  console.log('📱 Acknowledge - deviceError:', deviceError)

  const patientInfo = deviceData?.patients
  console.log('📱 Acknowledge - patientInfo:', patientInfo)
  console.log('📱 Acknowledge - relative_line_id:', patientInfo?.relative_line_id)

  // Send LINE notification when caregiver accepts the task (same as blue button)
  if (patientInfo?.relative_line_id) {
    const msg = `🏃‍♂️ เจ้าหน้าที่รับงานแล้ว\nผู้ป่วย: ${patientInfo.name || 'ไม่ระบุชื่อ'}\nเวลา: ${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}\n\nเจ้าหน้าที่กำลังเดินทางไปหาผู้ป่วยครับ`;
    console.log('📱 Sending LINE notification to:', patientInfo.relative_line_id)
    await sendLineNotification(patientInfo.relative_line_id, msg);
  } else {
    console.warn('⚠️ No relative_line_id found, skipping LINE notification')
  }

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
