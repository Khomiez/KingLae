#!/usr/bin/env node

/**
 * KingLae Database Reset & Minimal Seeder
 *
 * 1. Clears ALL existing data while respecting foreign key constraints
 * 2. Repopulates with a minimal, coherent dataset:
 *    - 1 caregiver
 *    - 1 Thai patient
 *    - 1 device assigned to that patient
 *    - Realistic events showing a complete lifecycle
 *
 * Run with: node scripts/reset-minimal.js
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================
// Load environment variables
// ============================================================

function loadEnvFile() {
  const envPath = join(__dirname, '..', '.env.local');
  try {
    const content = readFileSync(envPath, 'utf8');
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
// Helper Functions
// ============================================================

function formatThaiDate(date) {
  return date.toISOString();
}

function subtractHours(date, hours) {
  const result = new Date(date);
  result.setHours(result.getHours() - Math.floor(hours));
  result.setMinutes(result.getMinutes() - (hours % 1) * 60);
  return result;
}

function subtractMinutes(date, minutes) {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() - minutes);
  return result;
}

// ============================================================
// Minimal Dataset - 1 Caregiver, 1 Patient, 1 Device, Events
// ============================================================

const CAREGIVER = {
  id: 'c0000000-0000-0000-0000-000000000001',
  name: 'พรชัย เกษมสุข',
  phone: '081-234-5678'
};

const PATIENT = {
  id: '10000000-0000-0000-0000-000000000001',
  name: 'คุณสมศักดิ์ มีสุข',
  date_of_birth: '1952-05-15',  // Born 1952, age ~73
  weight: 62.5,
  height: 165.0,
  symptoms: 'ความดันโลหิตสูง เจ็บหัวบ่อย เดินลำบาก',  // Hypertension, frequent headaches, difficulty walking
  address: 'บ้านเลขที่ 42 หมู่ 3 ถนนสุขุมวิท ตำบลคลองตันเหนือ อำเภอวัฒนา กรุงเทพมหานคร 10110',
  relative_line_id: 'U' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
};

const DEVICE = {
  mac_address: 'A1:B2:C3:D4:E5:F6',
  patient_id: PATIENT.id,
  battery_level: 78,
  state: 'IDLE',
  health: 'ONLINE'
};

// Generate realistic event lifecycle spanning 3 days
// Shows: SOS -> Acknowledged -> Resolved, ASSIST -> Cancelled, MORNING_WAKEUP -> Resolved
function generateEvents() {
  const now = new Date('2026-02-28T10:00:00.000Z');  // Current time in script context

  return [
    // Day 1 - Three days ago: Morning check-in (RESOLVED)
    {
      id: 'e0000000-0000-0000-0000-000000000001',
      device_mac: DEVICE.mac_address,
      event_type: 'MORNING_WAKEUP',
      status: 'RESOLVED',
      created_at: subtractHours(subtractHours(now, 72), 2).toISOString(),  // 3 days ago, 8 AM
      acknowledged_by: CAREGIVER.id,
      acknowledged_at: subtractHours(subtractHours(now, 72), 1.9).toISOString(),  // 6 min later
      resolved_at: subtractHours(subtractHours(now, 72), 0.5).toISOString(),  // 1.5 hours later
      caregiver_note: 'ผู้ป่วยตื่นแล้ว รับประทานยาตามนัด เป็นปกติ'
    },
    // Day 1 afternoon: Assistance request (CANCELLED - false alarm)
    {
      id: 'e0000000-0000-0000-0000-000000000002',
      device_mac: DEVICE.mac_address,
      event_type: 'ASSIST',
      status: 'CANCELLED',
      created_at: subtractHours(subtractHours(now, 71), 3).toISOString(),  // 3 days ago, 3 PM
      acknowledged_by: null,
      acknowledged_at: null,
      resolved_at: subtractMinutes(subtractHours(subtractHours(now, 71), 3), 5).toISOString(),  // 5 min later
      caregiver_note: 'ผู้ป่วยกดปุ่มทดสอบ ไม่มีเหตุฉุกเฉิน'
    },
    // Day 2 - Two days ago: SOS emergency (RESOLVED - full lifecycle)
    {
      id: 'e0000000-0000-0000-0000-000000000003',
      device_mac: DEVICE.mac_address,
      event_type: 'SOS',
      status: 'RESOLVED',
      created_at: subtractHours(subtractHours(now, 48), 10).toISOString(),  // 2 days ago, midnight
      acknowledged_by: CAREGIVER.id,
      acknowledged_at: subtractMinutes(subtractHours(subtractHours(now, 48), 10), 8).toISOString(),  // 8 min response
      resolved_at: subtractHours(subtractHours(subtractHours(now, 48), 10), 1).toISOString(),  // 1 hour to resolve
      caregiver_note: 'ผู้ป่วยหกล้มที่ห้องน้ำ มีอาการปวดเอวเล็กน้อย ให้ยาแก้ปวดและพักผ่อน อาการดีขึ้น'
    },
    // Day 2 afternoon: Missed check-in (ACKNOWLEDGED, resolved later off-system)
    {
      id: 'e0000000-0000-0000-0000-000000000004',
      device_mac: DEVICE.mac_address,
      event_type: 'MISSED_CHECKIN',
      status: 'RESOLVED',
      created_at: subtractHours(subtractHours(now, 47), 14).toISOString(),  // 2 days ago, 2 PM
      acknowledged_by: CAREGIVER.id,
      acknowledged_at: subtractMinutes(subtractHours(subtractHours(now, 47), 14), 15).toISOString(),
      resolved_at: subtractHours(subtractHours(subtractHours(now, 47), 13), 22).toISOString(),
      caregiver_note: 'โทรตามผู้ป่วย พบว่าหลับอยู่ ไม่ได้กดปุ่มเช็คอิน'
    },
    // Day 3 - Yesterday: Morning check-in (RESOLVED)
    {
      id: 'e0000000-0000-0000-0000-000000000005',
      device_mac: DEVICE.mac_address,
      event_type: 'MORNING_WAKEUP',
      status: 'RESOLVED',
      created_at: subtractHours(subtractHours(now, 24), 2).toISOString(),  // Yesterday 8 AM
      acknowledged_by: CAREGIVER.id,
      acknowledged_at: subtractMinutes(subtractHours(subtractHours(now, 24), 2), 10).toISOString(),
      resolved_at: subtractHours(subtractHours(now, 24), 1.5).toISOString(),
      caregiver_note: 'เช็คอินปกติ รับประทานยาความดันแล้ว'
    },
    // Today - Current: Active ASSIST request (PENDING - waiting for caregiver)
    {
      id: 'e0000000-0000-0000-0000-000000000006',
      device_mac: DEVICE.mac_address,
      event_type: 'ASSIST',
      status: 'PENDING',
      created_at: subtractMinutes(now, 15).toISOString(),  // 15 minutes ago
      acknowledged_by: null,
      acknowledged_at: null,
      resolved_at: null,
      caregiver_note: null
    }
  ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

const EVENTS = generateEvents();

// ============================================================
// Main Reset Function
// ============================================================

async function resetDatabase() {
  const client = new Client({ connectionString: env.DATABASE_URI });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // ============================================================
    // STEP 1: Inspect current state
    // ============================================================
    console.log('📊 STEP 1: Inspecting current database state...\n');

    const [caregiversCount, patientsCount, devicesCount, eventsCount] = await Promise.all([
      client.query('SELECT COUNT(*) as count FROM caregivers'),
      client.query('SELECT COUNT(*) as count FROM patients'),
      client.query('SELECT COUNT(*) as count FROM devices'),
      client.query('SELECT COUNT(*) as count FROM events')
    ]);

    console.log('   Current records:');
    console.log(`   ├─ Caregivers: ${caregiversCount.rows[0].count}`);
    console.log(`   ├─ Patients:  ${patientsCount.rows[0].count}`);
    console.log(`   ├─ Devices:   ${devicesCount.rows[0].count}`);
    console.log(`   └─ Events:    ${eventsCount.rows[0].count}\n`);

    // ============================================================
    // STEP 2: Clear all data (respecting foreign keys)
    // ============================================================
    console.log('🗑️  STEP 2: Clearing all existing data...\n');

    // Delete in correct order to respect foreign key constraints:
    // 1. Events first (references devices and caregivers)
    // 2. Devices (references patients)
    // 3. Patients
    // 4. Caregivers

    const deletedEvents = await client.query('DELETE FROM events');
    console.log(`   ✅ Deleted ${deletedEvents.rowCount} events`);

    const deletedDevices = await client.query('DELETE FROM devices');
    console.log(`   ✅ Deleted ${deletedDevices.rowCount} devices`);

    const deletedPatients = await client.query('DELETE FROM patients');
    console.log(`   ✅ Deleted ${deletedPatients.rowCount} patients`);

    const deletedCaregivers = await client.query('DELETE FROM caregivers');
    console.log(`   ✅ Deleted ${deletedCaregivers.rowCount} caregivers\n`);

    // ============================================================
    // STEP 3: Insert minimal dataset
    // ============================================================
    console.log('🌱 STEP 3: Inserting minimal test dataset...\n');

    // Insert Caregiver
    console.log('   💾 Inserting caregiver...');
    await client.query(
      'INSERT INTO caregivers (id, name, phone, created_at) VALUES ($1, $2, $3, NOW())',
      [CAREGIVER.id, CAREGIVER.name, CAREGIVER.phone]
    );
    console.log(`       ✅ 1 caregiver: ${CAREGIVER.name}`);

    // Insert Patient
    console.log('   💾 Inserting patient...');
    await client.query(
      `INSERT INTO patients (id, name, date_of_birth, weight, height, symptoms, address, relative_line_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [PATIENT.id, PATIENT.name, PATIENT.date_of_birth, PATIENT.weight, PATIENT.height,
       PATIENT.symptoms, PATIENT.address, PATIENT.relative_line_id]
    );
    console.log(`       ✅ 1 patient: ${PATIENT.name}`);

    // Insert Device
    console.log('   💾 Inserting device...');
    await client.query(
      `INSERT INTO devices (mac_address, patient_id, battery_level, state, health, last_seen_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [DEVICE.mac_address, DEVICE.patient_id, DEVICE.battery_level, DEVICE.state, DEVICE.health]
    );
    console.log(`       ✅ 1 device: ${DEVICE.mac_address} → ${PATIENT.name}`);

    // Insert Events
    console.log('   💾 Inserting events...');
    for (const event of EVENTS) {
      await client.query(
        `INSERT INTO events (id, device_mac, event_type, status, created_at, acknowledged_by, acknowledged_at, resolved_at, caregiver_note)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [event.id, event.device_mac, event.event_type, event.status,
         event.created_at, event.acknowledged_by, event.acknowledged_at,
         event.resolved_at, event.caregiver_note]
      );
    }
    console.log(`       ✅ ${EVENTS.length} events inserted\n`);

    // ============================================================
    // STEP 4: Verify final state
    // ============================================================
    console.log('✅ STEP 4: Verifying final database state...\n');

    const [finalCaregivers, finalPatients, finalDevices, finalEvents] = await Promise.all([
      client.query('SELECT * FROM caregivers'),
      client.query('SELECT id, name, date_of_birth FROM patients'),
      client.query('SELECT mac_address, patient_id, state, health FROM devices'),
      client.query('SELECT id, event_type, status, created_at FROM events ORDER BY created_at')
    ]);

    console.log('   📋 Final Records:');
    console.log(`   ├─ Caregivers: ${finalCaregivers.rows.length}`);
    finalCaregivers.rows.forEach(c => console.log(`   │  └─ ${c.name} (${c.phone})`));

    console.log(`   ├─ Patients: ${finalPatients.rows.length}`);
    finalPatients.rows.forEach(p => console.log(`   │  └─ ${p.name} (DOB: ${p.date_of_birth.toISOString().split('T')[0]})`));

    console.log(`   ├─ Devices: ${finalDevices.rows.length}`);
    finalDevices.rows.forEach(d => console.log(`   │  └─ ${d.mac_address} → ${d.state} / ${d.health}`));

    console.log(`   └─ Events: ${finalEvents.rows.length}`);
    finalEvents.rows.forEach((e, i) => {
      const isLast = i === finalEvents.rows.length - 1;
      const time = new Date(e.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', hour12: false });
      console.log(`      ${isLast ? '└─' : '├─'} [${e.event_type}] ${e.status} @ ${time}${e.status === 'PENDING' ? ' ⚠️ ACTIVE' : ''}`);
    });

    console.log('\n🎉 Database reset successfully!');
    console.log('\n📝 Dataset Summary:');
    console.log('   • 1 caregiver (พรชัย เกษมสุข)');
    console.log('   • 1 Thai patient (คุณสมศักดิ์ มีสุข, age ~73)');
    console.log('   • 1 device assigned (A1:B2:C3:D4:E5:F6)');
    console.log('   • 6 events showing realistic lifecycle:');
    console.log('     - 3x MORNING_WAKEUP (all resolved)');
    console.log('     - 1x ASSIST cancelled (false alarm)');
    console.log('     - 1x SOS resolved (fall in bathroom)');
    console.log('     - 1x MISSED_CHECKIN resolved');
    console.log('     - 1x ASSIST PENDING (active, awaiting response)');

  } catch (err) {
    console.error('\n❌ Error during reset:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Database connection closed.');
  }
}

// Run reset
resetDatabase();
