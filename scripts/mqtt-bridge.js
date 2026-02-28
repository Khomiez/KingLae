import 'dotenv/config';
import mqtt from 'mqtt';
import { createClient } from '@supabase/supabase-js';

// Config from env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const lineAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const mqttServer = "mqtt://localhost";

const supabase = createClient(supabaseUrl, supabaseKey);
const client = mqtt.connect(mqttServer);

// --- ฟังก์ชันส่งการแจ้งเตือน LINE ---
async function sendLineNotification(lineUserId, message) {
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
  } catch (error) {
    console.error('❌ Failed to send LINE notification:', error.message);
  }
}

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');
  client.subscribe('iot/device/+/event');
  client.subscribe('iot/device/+/status');
});

client.on('message', async (topic, message) => {
  const payload = message.toString();
  console.log(`📥 Received message on ${topic}: ${payload}`);

  try {
    if (topic.endsWith('/event')) {
      const data = JSON.parse(payload);
      const mac = data.device_mac;
      const eventType = data.event_type;

      // 1. อัปเดตแบตเตอรี่และเวลาที่เห็นล่าสุดเสมอ
      if (data.battery_level !== undefined) {
        await supabase
          .from('devices')
          .update({ battery_level: data.battery_level, last_seen_at: new Date().toISOString() })
          .eq('mac_address', mac);
      }

      // 💡 2. ดึงสถานะปัจจุบันของเครื่อง (State) และข้อมูลผู้ป่วยออกมาก่อนเสมอ
      const { data: deviceData } = await supabase
        .from('devices')
        .select('state, patients(name, relative_line_id)')
        .eq('mac_address', mac)
        .single();

      const currentState = deviceData ? deviceData.state : 'IDLE';
      const patientInfo = deviceData?.patients;
      const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

      // ==========================================
      // 🔴 กรณีปุ่ม แดง (SOS)
      // ==========================================
      if (eventType === 'SOS') {
        if (currentState === 'IDLE' || currentState === 'MORNING_WINDOW' || currentState === 'GRACE_PERIOD' || currentState === 'ASSIST_REQUESTED') {
          
          if (currentState === 'ASSIST_REQUESTED') {
            await supabase.from('events').update({ status: 'CANCELLED', resolved_at: new Date().toISOString() })
              .eq('device_mac', mac).eq('status', 'PENDING');
          }

          await supabase.from('events').insert([{ device_mac: mac, event_type: 'SOS', status: 'PENDING' }]);
          await supabase.from('devices').update({ state: 'EMERGENCY' }).eq('mac_address', mac);
          console.log(`🚨 Triggered SOS for ${mac}`);

          // ส่ง LINE Notification
          if (patientInfo?.relative_line_id) {
            const msg = `🚨 แจ้งเตือนด่วน: คุณ ${patientInfo.name || 'ผู้ป่วย'} ต้องการความช่วยเหลือฉุกเฉิน (SOS)!\n\nกรุณาตรวจสอบในระบบหรือติดต่อผู้ป่วยทันทีครับ`;
            await sendLineNotification(patientInfo.relative_line_id, msg);
          }
        } else {
          console.log(`⚠️ Ignored SOS: Device is currently busy in state [${currentState}]`);
        }
      }

      // ==========================================
      // 🟡 กรณีปุ่ม เหลือง (ASSIST)
      // ==========================================
      else if (eventType === 'ASSIST') {
        if (currentState === 'IDLE' || currentState === 'MORNING_WINDOW' || currentState === 'GRACE_PERIOD') {
          await supabase.from('events').insert([{ device_mac: mac, event_type: 'ASSIST', status: 'PENDING' }]);
          await supabase.from('devices').update({ state: 'ASSIST_REQUESTED' }).eq('mac_address', mac);
          console.log(`🔔 Triggered ASSIST for ${mac}`);

          // ส่ง LINE Notification
          if (patientInfo?.relative_line_id) {
            const msg = `🟡 แจ้งเตือน: คุณ ${patientInfo.name || 'ผู้ป่วย'} ต้องการความช่วยเหลือทั่วไป (ASSIST)\n\nขณะนี้ระบบกำลังประสานงานเจ้าหน้าที่ให้ครับ`;
            await sendLineNotification(patientInfo.relative_line_id, msg);
          }
        } else {
          console.log(`⚠️ Ignored ASSIST: Device is currently busy in state [${currentState}]`);
        }
      }

      // ==========================================
      // 🟢 กรณีปุ่ม เขียว (GREEN_BTN)
      // ==========================================
      else if (eventType === 'GREEN_BTN') {
        if (currentState === 'EMERGENCY' || currentState === 'ASSIST_REQUESTED') {
          await supabase.from('events')
            .update({ status: 'CANCELLED', resolved_at: new Date().toISOString() })
            .eq('device_mac', mac)
            .eq('status', 'PENDING');
          
          await supabase.from('devices').update({ state: 'IDLE' }).eq('mac_address', mac);
          console.log(`🛑 Cancelled active alert for ${mac}`);
        } 
        else if (currentState === 'CAREGIVER_ON_THE_WAY') {
          // ดึงชื่อเจ้าหน้าที่มาแสดง
          const { data: eventData } = await supabase
            .from('events')
            .select('caregivers(name)')
            .eq('device_mac', mac)
            .eq('status', 'ACKNOWLEDGED')
            .single();

          const caregiverName = eventData?.caregivers?.name || 'เจ้าหน้าที่';

          await supabase.from('events')
            .update({ status: 'RESOLVED', resolved_at: new Date().toISOString() })
            .eq('device_mac', mac)
            .eq('status', 'ACKNOWLEDGED');
            
          await supabase.from('devices').update({ state: 'IDLE' }).eq('mac_address', mac);
          console.log(`🩺 Caregiver arrived and resolved case for ${mac}`);

          // ส่ง LINE Notification เมื่อทำงานเสร็จ
          if (patientInfo?.relative_line_id) {
            const msg = `🩺 แจ้งเตือน: เจ้าหน้าที่มาถึงแล้ว\n\nคุณ ${caregiverName} เดินทางถึงคุณ ${patientInfo.name || 'ผู้ป่วย'} แล้วและกำลังดำเนินการดูแลครับ`;
            await sendLineNotification(patientInfo.relative_line_id, msg);
          }
        }
        else if (currentState === 'MORNING_WINDOW' || currentState === 'GRACE_PERIOD') {
          await supabase.from('events').insert([{ device_mac: mac, event_type: 'MORNING_WAKEUP', status: 'RESOLVED', resolved_at: new Date().toISOString() }]);
          await supabase.from('devices').update({ state: 'IDLE' }).eq('mac_address', mac);
          console.log(`🌅 Morning check-in successful for ${mac}`);
        }
      }

      // ==========================================
      // 🔵 กรณีปุ่ม น้ำเงิน (BLUE_BTN)
      // ==========================================
      else if (eventType === 'BLUE_BTN') {
        if (currentState === 'EMERGENCY' || currentState === 'ASSIST_REQUESTED') {
          // ดึงชื่อ Caregiver (สำหรับ Demo ดึงคนแรกในตารางมาแสดง)
          const { data: caregiver } = await supabase
            .from('caregivers')
            .select('id, name')
            .limit(1)
            .single();

          const caregiverName = caregiver?.name || 'เจ้าหน้าที่ KingLae';

          await supabase.from('events')
            .update({ 
              status: 'ACKNOWLEDGED', 
              acknowledged_at: new Date().toISOString(),
              acknowledged_by: caregiver?.id
            })
            .eq('device_mac', mac)
            .eq('status', 'PENDING');
          
          await supabase.from('devices').update({ state: 'CAREGIVER_ON_THE_WAY' }).eq('mac_address', mac);
          console.log(`🏃‍♂️ ${caregiverName} accepted task for ${mac}`);

          // ส่ง LINE Notification เมื่อมีคนกดรับงาน
          if (patientInfo?.relative_line_id) {
            const msg = `🏃‍♂️ รับทราบเหตุ: เจ้าหน้าที่กำลังเดินทาง!\n\nคุณ ${caregiverName} ได้กดรับแจ้งเหตุของ คุณ ${patientInfo.name || 'ผู้ป่วย'} แล้วเมื่อเวลา ${timeStr} น. และกำลังเร่งเดินทางไปหาครับ`;
            await sendLineNotification(patientInfo.relative_line_id, msg);
          }
        }
      }

    } 
    else if (topic.endsWith('/status')) {
      const mac = topic.split('/')[2];
      const status = payload; 

      const { error: statusError } = await supabase
        .from('devices')
        .update({ 
          health: status === 'ONLINE' ? 'ONLINE' : 'OFFLINE',
          last_seen_at: new Date().toISOString()
        })
        .eq('mac_address', mac);

      if (statusError) console.error('❌ Error updating status:', statusError.message);
      else console.log(`💓 Updated health status for ${mac}: ${status}`);
    }
  } catch (err) {
    console.error('❌ Failed to process message:', err.message);
  }
});