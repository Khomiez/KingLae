#!/usr/bin/env node

import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnvFile() {
  const envPath = join(__dirname, '..', '.env.local');
  const content = readFileSync(envPath, 'utf-8');
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

async function verify() {
  const client = new Client({ connectionString: env.DATABASE_URI });

  try {
    await client.connect();

    console.log('📊 Sample data verification:\n');

    // Caregivers
    const caregivers = await client.query('SELECT name, phone FROM caregivers LIMIT 3');
    console.log('👨‍⚕️  Caregivers:');
    caregivers.rows.forEach(c => console.log(`   - ${c.name}: ${c.phone}`));

    // Patients
    const patients = await client.query('SELECT name, date_of_birth, symptoms FROM patients LIMIT 3');
    console.log('\n👥 Patients:');
    patients.rows.forEach(p => console.log(`   - ${p.name} (${p.date_of_birth}): ${p.symptoms?.substring(0, 40)}...`));

    // Devices
    const devices = await client.query('SELECT mac_address, state, health, battery_level FROM devices LIMIT 3');
    console.log('\n📱 Devices:');
    devices.rows.forEach(d => console.log(`   - ${d.mac_address}: ${d.state} / ${d.health} / ${d.battery_level}%`));

    // Events by status
    const events = await client.query('SELECT status, COUNT(*) FROM events GROUP BY status');
    console.log('\n📱 Events by status:');
    events.rows.forEach(e => console.log(`   - ${e.status}: ${e.count}`));

    // Events by type
    const eventTypes = await client.query('SELECT event_type, COUNT(*) FROM events GROUP BY event_type');
    console.log('\n📱 Events by type:');
    eventTypes.rows.forEach(e => console.log(`   - ${e.event_type}: ${e.count}`));

  } finally {
    await client.end();
  }
}

verify();
