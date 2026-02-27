#!/usr/bin/env node

/**
 * Quick database reset for development
 * Deletes all seed data
 */

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
      if (key) {
        env[key] = valueParts.join('=');
      }
    }
  }
  return env;
}

const env = loadEnvFile();
const { Client } = pg;

async function reset() {
  const client = new Client({ connectionString: env.DATABASE_URI });

  try {
    await client.connect();
    console.log('Connected to database.\n');

    // Delete in correct order due to foreign key constraints
    await client.query('DELETE FROM events;');
    console.log('✅ Deleted all events');

    await client.query('DELETE FROM devices;');
    console.log('✅ Deleted all devices');

    await client.query('DELETE FROM patients;');
    console.log('✅ Deleted all patients');

    await client.query('DELETE FROM caregivers;');
    console.log('✅ Deleted all caregivers');

    console.log('\n🎉 Database reset complete!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

reset();
