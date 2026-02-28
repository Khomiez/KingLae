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

async function completeEvent(req: NextRequest, id: string) {
  const body = await req.json()
  const { caregiver_note, notes } = body
  const finalNote = caregiver_note ?? notes ?? null

  const supabase = createServerClient()

  // Verify event exists and is RESOLVED, and fetch device info
  const { data: existing, error: fetchError } = await supabase
    .from('events')
    .select('status, device_mac')
    .eq('id', id)
    .single()

  if (fetchError) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  if (existing.status !== 'RESOLVED') {
    return NextResponse.json({ error: `Cannot complete event with status: ${existing.status}` }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('events')
    .update({
      status: 'COMPLETED',
      caregiver_note: finalNote,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Reset device state to IDLE (caregiver finished writing report)
  await supabase
    .from('devices')
    .update({ state: 'IDLE' })
    .eq('mac_address', existing.device_mac)

  // Fetch patient info to send LINE notification
  const { data: deviceData } = await supabase
    .from('devices')
    .select('patients(name, relative_line_id)')
    .eq('mac_address', existing.device_mac)
    .single()

  const patientInfo = deviceData?.patients

  // Send LINE notification when caregiver completes the report
  if (patientInfo?.relative_line_id) {
    const msg = `✅ แจ้งเตือน: เจ้าหน้าที่ทำการดูแลเสร็จสิ้นแล้ว\nผู้ป่วย: ${patientInfo.name || 'ไม่ระบุชื่อ'}\nสถานะ: ปลอดภัย (อุปกรณ์พร้อมใช้งาน)`;
    console.log('📱 Sending LINE notification to:', patientInfo.relative_line_id)
    await sendLineNotification(patientInfo.relative_line_id, msg);
  } else {
    console.warn('⚠️ No relative_line_id found, skipping LINE notification')
  }

  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  return completeEvent(req, id)
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  return completeEvent(req, id)
}
