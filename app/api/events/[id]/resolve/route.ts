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

async function resolveEvent(req: NextRequest, id: string) {
  const body = await req.json()
  const { caregiver_note, notes } = body
  const finalNote = caregiver_note ?? notes ?? null

  const supabase = createServerClient()

  // Verify event exists and is ACKNOWLEDGED, and fetch acknowledged_by
  const { data: existing, error: fetchError } = await supabase
    .from('events')
    .select('status, device_mac, acknowledged_by')
    .eq('id', id)
    .single()

  if (fetchError) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  if (existing.status !== 'ACKNOWLEDGED') {
    return NextResponse.json({ error: `Cannot resolve event with status: ${existing.status}` }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('events')
    .update({
      status: 'RESOLVED',
      resolved_at: new Date().toISOString(),
      caregiver_note: finalNote,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Reset device state to IDLE
  await supabase
    .from('devices')
    .update({ state: 'IDLE' })
    .eq('mac_address', existing.device_mac)

  // Fetch caregiver info to get name
  const caregiverData = existing.acknowledged_by
    ? await supabase
        .from('caregivers')
        .select('name')
        .eq('id', existing.acknowledged_by)
        .single()
    : null

  const caregiverName = caregiverData?.data?.name || 'เจ้าหน้าที่'

  // Fetch patient info to send LINE notification
  const { data: deviceData } = await supabase
    .from('devices')
    .select('patients(name, relative_line_id)')
    .eq('mac_address', existing.device_mac)
    .single()

  const patientInfo = deviceData?.patients

  // Send LINE notification when caregiver resolves the event
  if (patientInfo?.relative_line_id) {
    const msg = `✅ แจ้งเตือน: เจ้าหน้าที่ดำเนินการเสร็จสิ้นแล้ว\nผู้ป่วย: ${patientInfo.name || 'ไม่ระบุชื่อ'}\nเจ้าหน้าที่: ${caregiverName}\nสถานะ: กำลังเขียนรายงาน`;
    console.log('📱 Sending LINE notification to:', patientInfo.relative_line_id)
    await sendLineNotification(patientInfo.relative_line_id, msg);
  } else {
    console.warn('⚠️ No relative_line_id found, skipping LINE notification')
  }

  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  return resolveEvent(req, id)
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  return resolveEvent(req, id)
}
