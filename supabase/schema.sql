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
  'CANCELLED'
);

CREATE TYPE device_state AS ENUM (
  'IDLE',
  'EMERGENCY',
  'ASSIST_REQUESTED',
  'WAITING_CAREGIVER_ACCEPT',
  'CAREGIVER_ON_THE_WAY',
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
  caregiver_note  TEXT
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_events_device_mac      ON events(device_mac);
CREATE INDEX IF NOT EXISTS idx_events_status          ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_type            ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_acknowledged_by ON events(acknowledged_by);
