require('dotenv').config();
const mqtt = require('mqtt');
const { createClient } = require('@supabase/supabase-js');

// Config from env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const mqttServer = "mqtt://localhost"; // ใช้ localhost เพราะรันในเครื่องเดียวกับ broker (docker)

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const client = mqtt.connect(mqttServer);

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  // Subscribe to all device events and status updates
  client.subscribe('iot/device/+/event');
  client.subscribe('iot/device/+/status');
});

client.on('message', async (topic, message) => {
  const payload = message.toString();
  console.log(`Received message on ${topic}: ${payload}`);

  try {
    if (topic.endsWith('/event')) {
      const data = JSON.parse(payload);
      
      // 1. Insert into events table
      const { error: eventError } = await supabase
        .from('events')
        .insert([{
          device_mac: data.device_mac,
          event_type: data.event_type,
          status: data.status || 'PENDING'
        }]);

      if (eventError) {
        console.error('Error inserting event:', eventError.message);
      } else {
        console.log(`Successfully logged ${data.event_type} event for ${data.device_mac}`);
      }

      // 2. Update device battery and last seen
      if (data.battery_level !== undefined) {
        await supabase
          .from('devices')
          .update({ 
            battery_level: data.battery_level,
            last_seen_at: new Date().toISOString()
          })
          .eq('mac_address', data.device_mac);
      }

    } else if (topic.endsWith('/status')) {
      const mac = topic.split('/')[2];
      const status = payload; // ONLINE or OFFLINE

      // Update device health and last seen
      const { error: statusError } = await supabase
        .from('devices')
        .update({ 
          health: status === 'ONLINE' ? 'ONLINE' : 'OFFLINE',
          last_seen_at: new Date().toISOString()
        })
        .eq('mac_address', mac);

      if (statusError) {
        console.error('Error updating status:', statusError.message);
      } else {
        console.log(`Updated status for ${mac}: ${status}`);
      }
    }
  } catch (err) {
    console.error('Failed to process message:', err.message);
  }
});
