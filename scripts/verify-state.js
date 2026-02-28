#!/usr/bin/env node

import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnvFile() {
  const envPath = join(__dirname, '..', '.env.local');
  const content = readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key) env[key] = valueParts.join('=');
    }
  }
  return env;
}

const env = loadEnvFile();
const { Client } = pg;

const client = new Client({ connectionString: env.DATABASE_URI });

await client.connect();

console.log('=== FINAL VERIFICATION ===\n');

// Caregiver
const cg = await client.query('SELECT * FROM caregivers');
console.log('👨‍⚕️ CAREGIVER (' + cg.rows.length + '):');
cg.rows.forEach(c => {
  console.log('  id:      ' + c.id);
  console.log('  name:    ' + c.name);
  console.log('  phone:   ' + c.phone);
  console.log('  created: ' + c.created_at.toISOString());
});

// Patient
const pt = await client.query('SELECT * FROM patients');
console.log('\n👤 PATIENT (' + pt.rows.length + '):');
pt.rows.forEach(p => {
  console.log('  id:        ' + p.id);
  console.log('  name:      ' + p.name);
  console.log('  dob:       ' + p.date_of_birth.toISOString().split('T')[0]);
  console.log('  weight:    ' + p.weight + ' kg');
  console.log('  height:    ' + p.height + ' cm');
  console.log('  symptoms:  ' + p.symptoms);
  console.log('  line_id:   ' + p.relative_line_id);
});

// Device
const dv = await client.query('SELECT * FROM devices');
console.log('\n📱 DEVICE (' + dv.rows.length + '):');
dv.rows.forEach(d => {
  console.log('  mac:          ' + d.mac_address);
  console.log('  patient_id:   ' + d.patient_id);
  console.log('  battery:      ' + d.battery_level + '%');
  console.log('  state:        ' + d.state);
  console.log('  health:       ' + d.health);
});

// Events
const ev = await client.query('SELECT * FROM events ORDER BY created_at');
console.log('\n📋 EVENTS (' + ev.rows.length + '):');
ev.rows.forEach((e, i) => {
  const time = new Date(e.created_at).toISOString().replace('T', ' ').substring(0, 19);
  console.log('  [' + (i+1) + '] ' + time + ' | ' + e.event_type.padEnd(15) + ' | ' + e.status.padEnd(12) + ' | ack_by: ' + (e.acknowledged_by || 'null'));
  if (e.caregiver_note) console.log('      └─ note: ' + e.caregiver_note);
});

// FK Integrity Check
console.log('\n🔍 REFERENTIAL INTEGRITY CHECK:');
const fk1 = await client.query('SELECT COUNT(*) as c FROM events WHERE device_mac NOT IN (SELECT mac_address FROM devices)');
const fk2 = await client.query('SELECT COUNT(*) as c FROM devices WHERE patient_id NOT IN (SELECT id FROM patients) AND patient_id IS NOT NULL');
const fk3 = await client.query('SELECT COUNT(*) as c FROM events WHERE acknowledged_by NOT IN (SELECT id FROM caregivers) AND acknowledged_by IS NOT NULL');
console.log('  Orphaned events (invalid device_mac):      ' + fk1.rows[0].c);
console.log('  Orphaned devices (invalid patient_id):    ' + fk2.rows[0].c);
console.log('  Orphaned events (invalid acknowledged_by): ' + fk3.rows[0].c);

const hasViolations = fk1.rows[0].c > 0 || fk2.rows[0].c > 0 || fk3.rows[0].c > 0;
if (hasViolations) {
  console.log('  ❌ Foreign key violations detected!');
  process.exit(1);
} else {
  console.log('  ✅ All foreign keys are valid!');
}

await client.end();
