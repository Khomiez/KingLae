import 'dotenv/config';
import mqtt from 'mqtt';
import { createClient } from '@supabase/supabase-js';

// Config from env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// 💡 ข้อควรระวัง: ถ้า Supabase เปิด RLS (Row Level Security) ไว้ การใช้ ANON_KEY อาจจะ Insert/Update ไม่เข้า 
// แนะนำให้ใช้ SERVICE_ROLE_KEY สำหรับสคริปต์ Backend ฝั่ง Server ครับ
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const mqttServer = "mqtt://localhost";

const supabase = createClient(supabaseUrl, supabaseKey);
const client = mqtt.connect(mqttServer);

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
          .update({ 
            battery_level: data.battery_level,
            last_seen_at: new Date().toISOString()
          })
          .eq('mac_address', mac);
      }

      // ==========================================
      // 🔴 🟡 กรณีปุ่ม แดง (SOS) หรือ เหลือง (ASSIST)
      // ==========================================
      if (eventType === 'SOS' || eventType === 'ASSIST') {
        // Insert event ใหม่
        const { error: eventError } = await supabase
          .from('events')
          .insert([{
            device_mac: mac,
            event_type: eventType,
            status: data.status || 'PENDING'
          }]);

        if (eventError) console.error('❌ Error inserting event:', eventError.message);
        else console.log(`✅ Logged ${eventType} event for ${mac}`);

        // อัปเดต State ของเครื่องในตาราง devices
        const newState = eventType === 'SOS' ? 'EMERGENCY' : 'ASSIST_REQUESTED';
        await supabase.from('devices').update({ state: newState }).eq('mac_address', mac);
      }

      // ==========================================
      // 🟢 กรณีปุ่ม เขียว (GREEN_BTN - ความฉลาดของระบบ)
      // ==========================================
      else if (eventType === 'GREEN_BTN') {
        // ดึงสถานะปัจจุบันของเครื่องมาเช็กก่อน
        const { data: deviceData, error: deviceError } = await supabase
          .from('devices')
          .select('state')
          .eq('mac_address', mac)
          .single();

        if (deviceData) {
          const currentState = deviceData.state;

          if (currentState === 'EMERGENCY' || currentState === 'ASSIST_REQUESTED') {
            // ยกเลิกการเรียก (กดปุ่มเขียวเพื่อ Cancel)
            await supabase.from('events')
              .update({ status: 'CANCELLED', resolved_at: new Date().toISOString() })
              .eq('device_mac', mac)
              .eq('status', 'PENDING');
            
            await supabase.from('devices').update({ state: 'IDLE' }).eq('mac_address', mac);
            console.log(`🛑 Cancelled active alert for ${mac}`);
          } 
          else if (currentState === 'CAREGIVER_ON_THE_WAY') {
            // Caregiver มาถึงและกดปุ่มยืนยัน
            await supabase.from('events')
              .update({ status: 'RESOLVED', resolved_at: new Date().toISOString() })
              .eq('device_mac', mac)
              .eq('status', 'ACKNOWLEDGED');
              
            await supabase.from('devices').update({ state: 'IDLE' }).eq('mac_address', mac);
            console.log(`🩺 Caregiver arrived and resolved case for ${mac}`);
          }
          else if (currentState === 'MORNING_WINDOW' || currentState === 'GRACE_PERIOD') {
            // ยืนยันการตื่นนอนตอนเช้า
            await supabase.from('events').insert([{
              device_mac: mac,
              event_type: 'MORNING_WAKEUP',
              status: 'RESOLVED',
              resolved_at: new Date().toISOString()
            }]);
            
            await supabase.from('devices').update({ state: 'IDLE' }).eq('mac_address', mac);
            console.log(`🌅 Morning check-in successful for ${mac}`);
          }
          else if (currentState === 'IDLE') {
            console.log(`🟢 Green button pressed while IDLE. Ignoring.`);
          }
        }
      }
      // ==========================================
      // 🔵 กรณีปุ่ม น้ำเงิน (BLUE_BTN - จำลองแอป Caregiver รับงาน)
      // ==========================================
      else if (eventType === 'BLUE_BTN') {
        const { data: deviceData } = await supabase
          .from('devices')
          .select('state')
          .eq('mac_address', mac)
          .single();

        if (deviceData) {
          const currentState = deviceData.state;

          // ถ้ามีคนกดเรียก (แดงหรือเหลือง) ค้างอยู่ ถึงจะกดรับงานได้
          if (currentState === 'EMERGENCY' || currentState === 'ASSIST_REQUESTED') {
            
            // 1. เปลี่ยนสถานะ Event เป็น ACKNOWLEDGED (รับทราบงานแล้ว)
            await supabase.from('events')
              .update({ 
                status: 'ACKNOWLEDGED', 
                acknowledged_at: new Date().toISOString() 
                // หมายเหตุ: ของจริงต้องใส่ acknowledged_by (UUID ของ Caregiver) ด้วย 
                // แต่ตอน Demo สามารถข้ามไปก่อน หรือใส่ UUID จำลองได้ครับ
              })
              .eq('device_mac', mac)
              .eq('status', 'PENDING');
            
            // 2. เปลี่ยนสถานะอุปกรณ์เป็น CAREGIVER_ON_THE_WAY
            await supabase.from('devices')
              .update({ state: 'CAREGIVER_ON_THE_WAY' })
              .eq('mac_address', mac);

            console.log(`🏃‍♂️ Caregiver accepted task for ${mac}. On the way!`);
          } else {
            console.log(`🔵 Blue button pressed, but no active alert for ${mac}.`);
          }
        }
      }
    } 
    // ==========================================
    // 💓 อัปเดตสถานะ Online/Offline (LWT)
    // ==========================================
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