# Database Schema Reference — IoT Bedside Emergency System (MVP)

> **Project:** KingLae — Smart Ward Prototype
> **Database:** PostgreSQL
> **Purpose:** Tracks patients, caregivers, devices, and all emergency/assistance events in a home-care IoT ecosystem.

---

## Overview

```
[Bedside Device] → MQTT → [Cloud Backend] → [Caregiver App]
                                          → [LINE OA (Relatives)]
```

The backend consumes MQTT payloads from ESP32 devices and writes structured records into this schema.

---

## ENUM Definitions

```sql
-- Button-triggered and system-generated event types
CREATE TYPE event_type_enum AS ENUM (
  'SOS',
  'ASSIST',
  'MORNING_WAKEUP',
  'MISSED_CHECKIN'
);

-- Lifecycle state of each event
CREATE TYPE event_status_enum AS ENUM (
  'PENDING',
  'ACKNOWLEDGED',
  'RESOLVED',
  'CANCELLED'
);

-- Device operational state (reflects real CareLink flow)
CREATE TYPE device_state_enum AS ENUM (
  'IDLE',
  'EMERGENCY',
  'ASSIST_REQUESTED',
  'WAITING_CAREGIVER_ACCEPT',
  'CAREGIVER_ON_THE_WAY',
  'MORNING_WINDOW',
  'GRACE_PERIOD'
);

-- Device hardware health
CREATE TYPE device_health_enum AS ENUM (
  'ONLINE',
  'OFFLINE',
  'LOW_BATTERY',
  'MAINTENANCE'
);
```

---

## Table Definitions

### 1. `caregivers`

Stores staff members responsible for responding to patient events.

```sql
CREATE TABLE caregivers (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  phone      VARCHAR(20)  NOT NULL UNIQUE
);
```

| Column | Type | Notes |
|--------|------|-------|
| `id` | SERIAL | Auto-increment primary key |
| `name` | VARCHAR(100) | Full name of caregiver |
| `phone` | VARCHAR(20) | Contact number, must be unique |

---

### 2. `patients`

Stores patient demographic and health profile. Each patient is linked to one active device.

```sql
CREATE TABLE patients (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(100)  NOT NULL,
  date_of_birth    DATE,
  weight           NUMERIC(5,2),          -- kg
  height           NUMERIC(5,2),          -- cm
  symptoms         TEXT,
  address          TEXT,
  relative_line_id VARCHAR(100)           -- LINE OA User ID for notifications
);
```

| Column | Type | Notes |
|--------|------|-------|
| `id` | SERIAL | Auto-increment primary key |
| `name` | VARCHAR(100) | Patient full name |
| `date_of_birth` | DATE | Used to compute age |
| `weight` | NUMERIC(5,2) | Kilograms |
| `height` | NUMERIC(5,2) | Centimeters |
| `symptoms` | TEXT | Free-text clinical notes |
| `address` | TEXT | Home address |
| `relative_line_id` | VARCHAR(100) | LINE OA ID for push notifications |

---

### 3. `devices`

Represents physical ESP32 bedside hardware. One device per patient.

```sql
CREATE TABLE devices (
  mac_address   VARCHAR(50)        PRIMARY KEY,
  patient_id    INT                NOT NULL REFERENCES patients(id) ON DELETE SET NULL,
  battery_level SMALLINT           CHECK (battery_level BETWEEN 0 AND 100),
  state         device_state_enum  NOT NULL DEFAULT 'IDLE',
  health        device_health_enum NOT NULL DEFAULT 'ONLINE',
  last_seen_at  TIMESTAMPTZ,
  UNIQUE (patient_id)              -- enforces one active device per patient
);
```

| Column | Type | Notes |
|--------|------|-------|
| `mac_address` | VARCHAR(50) | Natural primary key (e.g., `ESP32-001`) |
| `patient_id` | INT (FK) | References `patients.id`; UNIQUE enforces 1-device-per-patient |
| `battery_level` | SMALLINT | 0–100 percentage |
| `state` | device_state_enum | Current operational state |
| `health` | device_health_enum | Hardware health status |
| `last_seen_at` | TIMESTAMPTZ | Last MQTT message received |

> **Note:** `state` and `health` are updated by the backend on each MQTT event. `last_seen_at` enables offline detection via a scheduled job.

---

### 4. `events`

Central event log. Every button press or system alert creates one record.

```sql
CREATE TABLE events (
  id               SERIAL PRIMARY KEY,
  device_mac       VARCHAR(50)        NOT NULL REFERENCES devices(mac_address) ON DELETE CASCADE,
  event_type       event_type_enum    NOT NULL,
  status           event_status_enum  NOT NULL DEFAULT 'PENDING',
  created_at       TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  acknowledged_by  INT                REFERENCES caregivers(id) ON DELETE SET NULL,
  resolved_at      TIMESTAMPTZ,
  caregiver_note   TEXT
);
```

| Column | Type | Notes |
|--------|------|-------|
| `id` | SERIAL | Auto-increment primary key |
| `device_mac` | VARCHAR(50) (FK) | References `devices.mac_address` |
| `event_type` | event_type_enum | `SOS`, `ASSIST`, `MORNING_WAKEUP`, `MISSED_CHECKIN` |
| `status` | event_status_enum | Lifecycle: `PENDING → ACKNOWLEDGED → RESOLVED` |
| `created_at` | TIMESTAMPTZ | Auto-set on insert |
| `acknowledged_by` | INT (FK, nullable) | Which caregiver accepted the event |
| `resolved_at` | TIMESTAMPTZ (nullable) | When event was closed |
| `caregiver_note` | TEXT | Free-text notes after resolution |

---

## Relationships Diagram

```
caregivers ──────────────────────────────┐
    id                                   │ acknowledged_by (nullable)
                                         ▼
patients ──────── devices ──────────── events
    id        mac_address (PK)           id
              patient_id (FK, UNIQUE)    device_mac (FK)
                                         event_type
                                         status
```

---

## MQTT → Database Flow

**Incoming MQTT payload (from ESP32):**

```json
{
  "mac_address": "ESP32-001",
  "action": "BUTTON_PRESS",
  "button_color": "RED",
  "battery_level": 85,
  "timestamp": 1709044237
}
```

**Backend mapping logic:**

| `button_color` | `event_type` inserted | Device `state` updated to |
|---|---|---|
| `RED` | `SOS` | `EMERGENCY` |
| `YELLOW` | `ASSIST` | `ASSIST_REQUESTED` |
| `GREEN` | `MORNING_WAKEUP` | `MORNING_WINDOW` |
| *(scheduler)* | `MISSED_CHECKIN` | `GRACE_PERIOD` |

**Backend steps on each message:**

1. Lookup device by `mac_address` — reject if not found
2. Update `devices.battery_level`, `devices.last_seen_at`, `devices.state`
3. Insert new row into `events` with status `PENDING`
4. Trigger notification (LINE OA → relative, push → caregiver app)

---

## Recommended Indexes

```sql
-- Fast lookup of all events for a device (most common query)
CREATE INDEX idx_events_device_mac ON events(device_mac);

-- Filter events by status (e.g., fetch all PENDING alerts)
CREATE INDEX idx_events_status ON events(status);

-- Filter events by type (e.g., SOS dashboard)
CREATE INDEX idx_events_type ON events(event_type);

-- Order events chronologically
CREATE INDEX idx_events_created_at ON events(created_at DESC);
```

---

## Complete Schema (Copy-Paste Ready)

```sql
-- ENUMs
CREATE TYPE event_type_enum AS ENUM ('SOS', 'ASSIST', 'MORNING_WAKEUP', 'MISSED_CHECKIN');
CREATE TYPE event_status_enum AS ENUM ('PENDING', 'ACKNOWLEDGED', 'RESOLVED', 'CANCELLED');
CREATE TYPE device_state_enum AS ENUM ('IDLE', 'EMERGENCY', 'ASSIST_REQUESTED', 'WAITING_CAREGIVER_ACCEPT', 'CAREGIVER_ON_THE_WAY', 'MORNING_WINDOW', 'GRACE_PERIOD');
CREATE TYPE device_health_enum AS ENUM ('ONLINE', 'OFFLINE', 'LOW_BATTERY', 'MAINTENANCE');

-- Tables
CREATE TABLE caregivers (
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(100) NOT NULL,
  phone VARCHAR(20)  NOT NULL UNIQUE
);

CREATE TABLE patients (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(100) NOT NULL,
  date_of_birth    DATE,
  weight           NUMERIC(5,2),
  height           NUMERIC(5,2),
  symptoms         TEXT,
  address          TEXT,
  relative_line_id VARCHAR(100)
);

CREATE TABLE devices (
  mac_address   VARCHAR(50)        PRIMARY KEY,
  patient_id    INT                NOT NULL REFERENCES patients(id) ON DELETE SET NULL,
  battery_level SMALLINT           CHECK (battery_level BETWEEN 0 AND 100),
  state         device_state_enum  NOT NULL DEFAULT 'IDLE',
  health        device_health_enum NOT NULL DEFAULT 'ONLINE',
  last_seen_at  TIMESTAMPTZ,
  UNIQUE (patient_id)
);

CREATE TABLE events (
  id              SERIAL PRIMARY KEY,
  device_mac      VARCHAR(50)       NOT NULL REFERENCES devices(mac_address) ON DELETE CASCADE,
  event_type      event_type_enum   NOT NULL,
  status          event_status_enum NOT NULL DEFAULT 'PENDING',
  created_at      TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  acknowledged_by INT               REFERENCES caregivers(id) ON DELETE SET NULL,
  resolved_at     TIMESTAMPTZ,
  caregiver_note  TEXT
);

-- Indexes
CREATE INDEX idx_events_device_mac  ON events(device_mac);
CREATE INDEX idx_events_status      ON events(status);
CREATE INDEX idx_events_type        ON events(event_type);
CREATE INDEX idx_events_created_at  ON events(created_at DESC);
```

---

## Design Notes & Suggestions

| # | Suggestion | Rationale |
|---|---|---|
| 1 | Add a `caregivers_patients` join table later | When scaling to multi-caregiver assignments per patient |
| 2 | Store `patient_id` on `events` directly (denormalized) | Avoids a JOIN through `devices` on every dashboard query |
| 3 | Add `notified_relative_at TIMESTAMPTZ` on `events` | Tracks when LINE notification was sent; avoids duplicate sends |
| 4 | Use `TIMESTAMPTZ` (not `TIMESTAMP`) everywhere | Timezone-safe; critical for IoT timestamps from devices |
| 5 | Add a `caregiver_shifts` table later | Enables routing alerts to the on-duty caregiver only |
| 6 | Offline detection via `last_seen_at` | A cron job sets `health = 'OFFLINE'` if `last_seen_at` > threshold |
| 7 | Keep `devices.state` as source of truth | The app reads device state from DB, not from MQTT directly |
