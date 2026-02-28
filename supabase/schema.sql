-- ============================================================
-- KingLae IoT Emergency System — Database Schema
-- ============================================================

-- ENUMS

CREATE TYPE event_type AS ENUM (
  'SOS',
  'ASSIST',
  'MORNING_WAKEUP',
  'MISSED_CHECKIN'
);

CREATE TYPE event_status AS ENUM (
  'PENDING',
  'ACKNOWLEDGED',
  'RESOLVED',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE triage_decision AS ENUM (
  'TRUE_SOS',
  'DOWNGRADED_TO_ASSIST'
);

CREATE TYPE device_state AS ENUM (
  'IDLE',
  'EMERGENCY',
  'ASSIST_REQUESTED',
  'WAITING_CAREGIVER_ACCEPT',
  'CAREGIVER_ON_THE_WAY',
  'CAREGIVER_ARRIVED',
  'MORNING_WINDOW',
  'GRACE_PERIOD'
);

CREATE TYPE device_health AS ENUM (
  'ONLINE',
  'OFFLINE',
  'LOW_BATTERY',
  'MAINTENANCE'
);

-- ============================================================
-- TABLE: caregivers
-- ============================================================

CREATE TABLE IF NOT EXISTS caregivers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  phone      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: patients
-- ============================================================

CREATE TABLE IF NOT EXISTS patients (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  date_of_birth    DATE,
  weight           NUMERIC(5, 2),
  height           NUMERIC(5, 2),
  symptoms         TEXT,
  address          TEXT,
  relative_line_id TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: devices
-- ============================================================

CREATE TABLE IF NOT EXISTS devices (
  mac_address   TEXT PRIMARY KEY,
  patient_id    UUID UNIQUE REFERENCES patients(id) ON DELETE SET NULL,
  battery_level SMALLINT CHECK (battery_level BETWEEN 0 AND 100),
  state         device_state NOT NULL DEFAULT 'IDLE',
  health        device_health NOT NULL DEFAULT 'ONLINE',
  last_seen_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: events
-- ============================================================

CREATE TABLE IF NOT EXISTS events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_mac      TEXT NOT NULL REFERENCES devices(mac_address) ON DELETE CASCADE,
  event_type      event_type NOT NULL,
  status          event_status NOT NULL DEFAULT 'PENDING',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_by UUID REFERENCES caregivers(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  caregiver_note  TEXT,
  -- Triage fields for SOS events
  triage_decision triage_decision,
  triage_by       UUID REFERENCES caregivers(id) ON DELETE SET NULL,
  triage_at       TIMESTAMPTZ,
  -- Flag to quickly identify confirmed true emergencies
  is_true_sos     BOOLEAN DEFAULT false
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_events_device_mac      ON events(device_mac);
CREATE INDEX IF NOT EXISTS idx_events_status          ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_type            ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_acknowledged_by ON events(acknowledged_by);
CREATE INDEX IF NOT EXISTS idx_events_triage_decision ON events(triage_decision);
CREATE INDEX IF NOT EXISTS idx_events_triage_by       ON events(triage_by);
CREATE INDEX IF NOT EXISTS idx_events_is_true_sos     ON events(is_true_sos);

-- ============================================================
-- MIGRATION: Add SOS triage fields to existing events table
-- ============================================================
-- Run these statements in order if updating an existing database:
-- NOTE: Run each statement separately in the Supabase SQL Editor

-- Step 1: Create the triage_decision enum type
CREATE TYPE triage_decision AS ENUM ('TRUE_SOS', 'DOWNGRADED_TO_ASSIST');

-- Step 2: Add triage columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS triage_decision triage_decision;
ALTER TABLE events ADD COLUMN IF NOT EXISTS triage_by UUID REFERENCES caregivers(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS triage_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_true_sos BOOLEAN DEFAULT false;

-- Step 3: Create indexes for triage fields
CREATE INDEX IF NOT EXISTS idx_events_triage_decision ON events(triage_decision);
CREATE INDEX IF NOT EXISTS idx_events_triage_by ON events(triage_by);
CREATE INDEX IF NOT EXISTS idx_events_is_true_sos ON events(is_true_sos);
