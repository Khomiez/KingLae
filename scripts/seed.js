#!/usr/bin/env node

/**
 * KingLae Database Seeder
 *
 * Generates realistic Thai home-care sample data.
 * Run with: node scripts/seed.js
 *
 * Requirements:
 * - Node.js 20+ (for built-in crypto.randomUUID())
 * - .env.local with DATABASE_URI
 * - pg package (already installed)
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================
// Load .env.local manually (no dotenv dependency)
// ============================================================

function loadEnvFile() {
  const envPath = join(__dirname, '..', '.env.local');
  try {
    const content = readFileSync(envPath, 'utf-8');
    const env = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key) {
          env[key] = valueParts.join('=');
        }
      }
    }
    return env;
  } catch (err) {
    console.error('Error loading .env.local:', err.message);
    process.exit(1);
  }
}

const env = loadEnvFile();
const { Client } = pg;

// ============================================================
// Thai Data Sources
// ============================================================

const THAI_FIRST_NAMES_MALE = [
  'สมชาย', 'สมศักดิ์', 'วีระ', 'สุเทพ', 'ประยุทธ์', 'อภิชาติ', 'ณรงค์', 'ชัย',
  'สุรชัย', 'มานะ', 'ธงชัย', 'พิชัย', 'วิชัย', 'รังสรรค์', 'ยุทธการ'
];

const THAI_FIRST_NAMES_FEMALE = [
  'สมหญิง', 'มาลี', 'สุดา', 'วิภา', 'นภา', 'รัชดา', 'จินตนา', 'สุรีย์',
  'อรุณ', 'ดวงแก้ว', 'ชูใจ', 'พอใจ', 'สบาย', 'จำเนียร', 'มณี'
];

const THAI_LAST_NAMES = [
  'ใจดี', 'รักษ์', 'สุข', 'มีสุข', 'เจริญ', 'เกตุ', 'ทองคำ', 'ศิริพงษ์',
  'สวัสดิ์', 'วงศ์สวัสดิ์', 'อินทรา', 'ประสงค์', 'พรชัย', 'ไชยวัฒน์', 'เจริญสุข',
  'สิริมงคล', 'เกิดสุข', 'รัตนา', 'บุญสม', 'เกษมสุข', 'อุดมสุข'
];

const THAI_PROVINCES = [
  'กรุงเทพมหานคร', 'ขอนแก่น', 'เชียงใหม่', 'นครราชสีมา', 'อุดรธานี',
  'สงขลา', 'นครศรีธรรมราช', 'ชลบุรี', 'ระยอง', 'พระนครศรีอยุธยา',
  'ลพบุรี', 'อ่างทอง', 'สิงห์บุรี', 'ชัยนาท', 'พิจิตร'
];

const SYMPTOMS_ELERLY = [
  'ความดันโลหิตสูง เจ็บหัวบ่อย',
  'เบาหวาน บาดแผลช้าหาย',
  'โรคหัวใจ หอบเหนื่อยง่าย',
  'อาการโรคหลอดเลือดสมอง อ่อนเพลีย',
  'หัวใจวายเรื้อรัง เต้นผิดจังหวะ',
  'อัลไซเมอร์ จำอะไรไม่ได้นาน',
  'ปอดอักเสบเรื้อรัง ไอเรื้อรัง',
  'ข้อเข่าเสื่อม เดินลำบาก',
  'กระดูกพรุน เจ็บหลังบ่อย',
  'ต้องใช้เตียงตลอดเวลา',
  'เสี่ยงล้ม ต้องการความช่วยเหลือ',
  'โรคไตเรื้อรัง ต้องฟอกไข',
  'ต้องใช้วีลแชร์ เคลื่อนไหวลำบาก',
  'หน้ามืด เวียนหัวบ่อย',
  'นอนไม่หลับ กลางคืนตื่นถี่'
];

const SYMPTOMS_ELERLY_ENG = [
  'Hypertension, frequent headaches',
  'Diabetes, slow-healing wounds',
  'Heart disease, easily fatigued',
  'Stroke recovery, general weakness',
  'Congestive heart failure, arrhythmia',
  "Alzheimer's, memory loss",
  'COPD, chronic cough',
  'Osteoarthritis of knee, difficulty walking',
  'Osteoporosis, frequent back pain',
  'Bedridden, requires full care',
  'Fall risk, needs assistance',
  'Chronic kidney disease, requires dialysis',
  'Wheelchair-bound, limited mobility',
  'Frequent dizziness, vertigo',
  'Insomnia, frequent night waking'
];

// ============================================================
// Helper Functions
// ============================================================

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomDate(startDate, endDate) {
  return new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function randomThaiPhone() {
  const prefixes = ['081', '082', '083', '085', '086', '087', '089', '091', '092', '093', '094', '095', '096', '097', '098', '099'];
  const prefix = pick(prefixes);
  const middle = randomInt(100, 999);
  const last = randomInt(1000, 9999);
  return `${prefix}-${middle}-${last}`;
}

function randomLineId() {
  return 'U' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function randomThaiAddress(province) {
  const houseNum = randomInt(1, 999);
  const moo = randomInt(1, 15);
  const road = [
    'ถนนสุขุมวิท', 'ถนนพหลโยธิน', 'ถนนเพชรบุรี', 'ถนนสีลม',
    'ถนนรัชดาภิเษก', 'ถนนลาดพร้าว', 'ถนนพระราม 9', 'ถนนวิภาวดีรังสิต',
    'ซอยลาดพร้าว', 'ซอยสุขุมวิท', 'ซอยพระราม 3', 'ซอยอารีย์',
    'ถนนมิตรภาพ', 'ถนนนิมมานฯ', 'ถนนโชคชัย', 'ถนนราชดำเนิน'
  ];
  return `บ้านเลขที่ ${houseNum} หมู่ ${moo} ${pick(road)} ตำบล${randomInt(1, 10)} อำเภอ${randomInt(1, 10)} ${province}`;
}

function randomMacAddress() {
  const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
  return `${hex()}:${hex()}:${hex()}:${hex()}:${hex()}:${hex()}`;
}

function randomAge(min = 60, max = 92) {
  return randomInt(min, max);
}

function calculateBirthYear(age) {
  const currentYear = new Date().getFullYear();
  return currentYear - age;
}

function randomSymptoms() {
  return Math.random() > 0.5 ? pick(SYMPTOMS_ELERLY_ENG) : pick(SYMPTOMS_ELERLY);
}

// ============================================================
// Generate Seed Data
// ============================================================

function generateCaregivers() {
  return [
    { id: 'c0000000-0000-0000-0000-000000000001', name: 'พรชัย เกษมสุข', phone: '081-234-5678' },
    { id: 'c0000000-0000-0000-0000-000000000002', name: 'สมหญิง รักษ์', phone: '082-345-6789' },
    { id: 'c0000000-0000-0000-0000-000000000003', name: 'วีระ สุข', phone: '085-456-7890' },
    { id: 'c0000000-0000-0000-0000-000000000004', name: 'สุดา เจริญ', phone: '086-567-8901' },
    { id: 'c0000000-0000-0000-0000-000000000005', name: 'ณรงค์ ใจดี', phone: '087-678-9012' },
    { id: 'c0000000-0000-0000-0000-000000000006', name: 'มาลี ทองคำ', phone: '089-789-0123' },
    { id: 'c0000000-0000-0000-0000-000000000007', name: 'อภิชาติ ศิริพงษ์', phone: '091-890-1234' },
    { id: 'c0000000-0000-0000-0000-000000000008', name: 'รัชดา สวัสดิ์', phone: '092-901-2345' },
  ];
}

function generatePatients() {
  const patients = [];
  let idx = 1;

  const configs = [
    { name: 'สมศักดิ์', lastname: 'มีสุข', age: 72, province: 'ขอนแก่น', symptoms: 'Hypertension, arthritis' },
    { name: 'วิภาวดี', lastname: 'สุข', age: 85, province: 'เชียงใหม่', symptoms: 'Stroke recovery, hemiplegia' },
    { name: 'ประยุทธ์', lastname: 'เกตุ', age: 68, province: 'กรุงเทพมหานคร', symptoms: 'Diabetes type 2, neuropathy' },
    { name: 'จินตนา', lastname: 'อินทรา', age: 91, province: 'นครราชสีมา', symptoms: 'Bedridden, pressure ulcers' },
    { name: 'สุเทพ', lastname: 'ประสงค์', age: 77, province: 'อุดรธานี', symptoms: "Alzheimer's, wanders off" },
    { name: 'นภา', lastname: 'รัตนา', age: 64, province: 'ชลบุรี', symptoms: 'Heart failure, edema' },
    { name: 'ชัย', lastname: 'พรชัย', age: 83, province: 'สงขลา', symptoms: 'COPD, oxygen dependent' },
    { name: 'สุรีย์', lastname: 'ไชยวัฒน์', age: 59, province: 'พระนครศรีอยุธยา', symptoms: 'Post-stroke, depression' },
    { name: 'ธงชัย', lastname: 'เจริญสุข', age: 76, province: 'ลพบุรี', symptoms: 'Fall risk, uses walker' },
    { name: 'มานะ', lastname: 'บุญสม', age: 88, province: 'อ่างทอง', symptoms: 'Dementia, incontinent' },
    { name: 'สมชาย', lastname: 'สิริมงคล', age: 65, province: 'สิงห์บุรี', symptoms: 'Kidney disease, dialysis 3x/week' },
    { name: 'พอใจ', lastname: 'เกิดสุข', age: 82, province: 'ชัยนาท', symptoms: 'Osteoporosis, history of falls' },
    { name: 'ยุทธการ', lastname: 'อุดมสุข', age: 70, province: 'ระยอง', symptoms: 'Parkinsons, tremors' },
    { name: 'ดวงแก้ว', lastname: 'วงศ์สวัสดิ์', age: 79, province: 'นครศรีธรรมราช', symptoms: 'Blind, diabetic retinopathy' },
    { name: 'อรุณ', lastname: 'พิจิตร', age: 67, province: 'พิจิตร', symptoms: 'Amputee (below knee), wheelchair' },
  ];

  for (const cfg of configs) {
    const hasWeight = Math.random() > 0.1; // 90% have weight
    const hasHeight = Math.random() > 0.1; // 90% have height
    const hasRelativeLine = Math.random() > 0.2; // 80% have LINE ID

    const birthYear = calculateBirthYear(cfg.age);
    const month = String(randomInt(1, 12)).padStart(2, '0');
    const day = String(randomInt(1, 28)).padStart(2, '0');

    patients.push({
      id: `10000000-0000-0000-0000-${String(idx).padStart(12, '0')}`,
      name: `${cfg.name} ${cfg.lastname}`,
      date_of_birth: `${birthYear}-${month}-${day}`,
      weight: hasWeight ? randomFloat(40, 85, 1) : null,
      height: hasHeight ? randomFloat(145, 175, 1) : null,
      symptoms: cfg.symptoms,
      address: randomThaiAddress(cfg.province),
      relative_line_id: hasRelativeLine ? randomLineId() : null,
    });
    idx++;
  }

  return patients;
}

function generateDevices(patients) {
  const states = ['IDLE', 'IDLE', 'IDLE', 'IDLE', 'IDLE', 'EMERGENCY', 'ASSIST_REQUESTED', 'CAREGIVER_ON_THE_WAY', 'MORNING_WINDOW', 'WAITING_CAREGIVER_ACCEPT', 'GRACE_PERIOD'];
  const healths = ['ONLINE', 'ONLINE', 'ONLINE', 'ONLINE', 'LOW_BATTERY', 'LOW_BATTERY', 'OFFLINE', 'MAINTENANCE'];

  return patients.map((p, i) => {
    const now = new Date();
    const lastSeenDays = randomInt(0, 7);
    const lastSeen = new Date(now.getTime() - lastSeenDays * 24 * 60 * 60 * 1000);

    return {
      mac_address: randomMacAddress(),
      patient_id: p.id,
      battery_level: randomInt(5, 100),
      state: pick(states),
      health: pick(healths),
      last_seen_at: lastSeen.toISOString(),
    };
  });
}

function generateEvents(devices, caregivers) {
  const events = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const eventTypes = ['SOS', 'ASSIST', 'MORNING_WAKEUP', 'MISSED_CHECKIN'];

  // For each device, generate 3-5 events
  for (const device of devices) {
    const eventCount = randomInt(3, 5);
    const sortedDates = Array.from({ length: eventCount }, () =>
      randomDate(thirtyDaysAgo, now)
    ).sort((a, b) => a - b);

    for (let i = 0; i < eventCount; i++) {
      const eventType = pick(eventTypes);
      const eventDate = sortedDates[i];

      // Distribute statuses: 50% RESOLVED, 20% ACKNOWLEDGED, 15% PENDING, 15% CANCELLED
      const statusRoll = Math.random();
      let status, acknowledged_by, acknowledged_at, resolved_at, caregiver_note;

      if (statusRoll < 0.50) {
        // RESOLVED
        status = 'RESOLVED';
        acknowledged_by = pick(caregivers).id;
        const resolvedDelay = randomInt(30, 480); // 30min to 8 hours
        const acknowledgedDelay = randomInt(5, resolvedDelay - 10);
        acknowledged_at = new Date(eventDate.getTime() + acknowledgedDelay * 60 * 1000).toISOString();
        resolved_at = new Date(eventDate.getTime() + resolvedDelay * 60 * 1000).toISOString();
        caregiver_note = pick(['Patient assisted', 'Situation resolved', 'Provided medication', 'Called relative', 'Ambulance called', 'False alarm - tested device']);
      } else if (statusRoll < 0.70) {
        // ACKNOWLEDGED (still pending resolution)
        status = 'ACKNOWLEDGED';
        acknowledged_by = pick(caregivers).id;
        const acknowledgedDelay = randomInt(5, 60);
        acknowledged_at = new Date(eventDate.getTime() + acknowledgedDelay * 60 * 1000).toISOString();
        resolved_at = null;
        caregiver_note = null;
      } else if (statusRoll < 0.85) {
        // PENDING
        status = 'PENDING';
        acknowledged_by = null;
        acknowledged_at = null;
        resolved_at = null;
        caregiver_note = null;
      } else {
        // CANCELLED
        status = 'CANCELLED';
        acknowledged_by = null;
        acknowledged_at = null;
        resolved_at = null;
        caregiver_note = pick(['Patient cancelled', 'False alarm', 'Button pressed accidentally', 'Test by family']);
      }

      events.push({
        id: `20000000-0000-0000-0000-${String(events.length + 1).padStart(12, '0')}`,
        device_mac: device.mac_address,
        event_type: eventType,
        status,
        created_at: eventDate.toISOString(),
        acknowledged_by,
        acknowledged_at,
        resolved_at,
        caregiver_note,
      });
    }
  }

  return events.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

// ============================================================
// Main Seeder Function
// ============================================================

async function seed() {
  const client = new Client({ connectionString: env.DATABASE_URI });

  try {
    console.log('🌱 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Check for existing data
    const { rows: existingCaregivers } = await client.query('SELECT COUNT(*) as count FROM caregivers');
    const { rows: existingPatients } = await client.query('SELECT COUNT(*) as count FROM patients');
    const { rows: existingDevices } = await client.query('SELECT COUNT(*) as count FROM devices');
    const { rows: existingEvents } = await client.query('SELECT COUNT(*) as count FROM events');

    console.log('📊 Current database state:');
    console.log(`   Caregivers: ${existingCaregivers[0].count}`);
    console.log(`   Patients: ${existingPatients[0].count}`);
    console.log(`   Devices: ${existingDevices[0].count}`);
    console.log(`   Events: ${existingEvents[0].count}\n`);

    // Confirm if data exists
    if (existingCaregivers[0].count > 0) {
      console.log('⚠️  Database already contains data.');
      console.log('    Delete existing data first or run this script with --force flag.');
      console.log('    To delete: TRUNCATE TABLE events, devices, patients, caregivers CASCADE;');
      return;
    }

    console.log('🌱 Starting seed...\n');

    // Generate data
    const caregivers = generateCaregivers();
    const patients = generatePatients();
    const devices = generateDevices(patients);
    const events = generateEvents(devices, caregivers);

    console.log(`📝 Generated ${caregivers.length} caregivers`);
    console.log(`📝 Generated ${patients.length} patients`);
    console.log(`📝 Generated ${devices.length} devices`);
    console.log(`📝 Generated ${events.length} events\n`);

    // Insert caregivers
    console.log('💾 Inserting caregivers...');
    for (const cg of caregivers) {
      await client.query(
        'INSERT INTO caregivers (id, name, phone, created_at) VALUES ($1, $2, $3, NOW())',
        [cg.id, cg.name, cg.phone]
      );
    }
    console.log(`   ✅ ${caregivers.length} caregivers inserted\n`);

    // Insert patients
    console.log('💾 Inserting patients...');
    for (const p of patients) {
      await client.query(
        `INSERT INTO patients (id, name, date_of_birth, weight, height, symptoms, address, relative_line_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [p.id, p.name, p.date_of_birth, p.weight, p.height, p.symptoms, p.address, p.relative_line_id]
      );
    }
    console.log(`   ✅ ${patients.length} patients inserted\n`);

    // Insert devices
    console.log('💾 Inserting devices...');
    for (const d of devices) {
      await client.query(
        `INSERT INTO devices (mac_address, patient_id, battery_level, state, health, last_seen_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [d.mac_address, d.patient_id, d.battery_level, d.state, d.health, d.last_seen_at]
      );
    }
    console.log(`   ✅ ${devices.length} devices inserted\n`);

    // Insert events
    console.log('💾 Inserting events...');
    for (const e of events) {
      await client.query(
        `INSERT INTO events (id, device_mac, event_type, status, created_at, acknowledged_by, acknowledged_at, resolved_at, caregiver_note)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [e.id, e.device_mac, e.event_type, e.status, e.created_at, e.acknowledged_by, e.acknowledged_at, e.resolved_at, e.caregiver_note]
      );
    }
    console.log(`   ✅ ${events.length} events inserted\n`);

    // Verify counts
    const { rows: finalCaregivers } = await client.query('SELECT COUNT(*) as count FROM caregivers');
    const { rows: finalPatients } = await client.query('SELECT COUNT(*) as count FROM patients');
    const { rows: finalDevices } = await client.query('SELECT COUNT(*) as count FROM devices');
    const { rows: finalEvents } = await client.query('SELECT COUNT(*) as count FROM events');

    console.log('🎉 Seed completed successfully!\n');
    console.log('📊 Final database state:');
    console.log(`   Caregivers: ${finalCaregivers[0].count}`);
    console.log(`   Patients: ${finalPatients[0].count}`);
    console.log(`   Devices: ${finalDevices[0].count}`);
    console.log(`   Events: ${finalEvents[0].count}\n`);

  } catch (err) {
    console.error('❌ Error during seed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('👋 Database connection closed.');
  }
}

// Run seed
seed();
