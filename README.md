# KingLae — IoT Bedside Emergency System

A smart home-care patient monitoring system. Bedside IoT devices (ESP32) publish button events via MQTT to a cloud backend, which logs them to Supabase and notifies caregivers and relatives via LINE OA.

```
[ESP32 Device] → MQTT Broker → [Next.js Backend] → Supabase DB
                                        ↓
                              Caregiver App / LINE OA
```

## Stack

| Layer | Technology |
|---|---|
| Frontend / Backend | Next.js 16 (App Router, TypeScript) |
| Database | Supabase (PostgreSQL) |
| MQTT Broker | Eclipse Mosquitto 2.0 (Docker) |
| Notifications | LINE OA |
| Device | ESP32 (3-button: SOS / Assist / Check-in) |

## Project Structure

```
kinglae/
├── app/                    # Next.js App Router
├── lib/
│   └── supabase.ts         # Supabase client
├── supabase/
│   └── schema.sql          # Database schema (source of truth)
├── scripts/
│   └── migrate.js          # Run schema against Supabase
├── mosquitto/
│   └── config/
│       └── mosquitto.conf  # Mosquitto broker config
├── docker-compose.yml      # MQTT broker service
└── .env.local              # Environment variables
```

## Database Schema

| Table | Purpose |
|---|---|
| `caregivers` | Staff who respond to events |
| `patients` | Patient profiles + LINE OA ID |
| `devices` | ESP32 units assigned to patients |
| `events` | Every button press and system alert |

Device states: `IDLE` → `EMERGENCY` / `ASSIST_REQUESTED` → `CAREGIVER_ON_THE_WAY` → resolved

Event types: `SOS`, `ASSIST`, `MORNING_WAKEUP`, `MISSED_CHECKIN`

## Getting Started

### 1. Environment

Copy the example and fill in your keys:

```bash
cp .env.local.example .env.local
```

```env
DATABASE_URI=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 2. Database

Apply the schema to Supabase:

```bash
DATABASE_URI="..." node scripts/migrate.js
```

### 3. MQTT Broker

Start Mosquitto via Docker:

```bash
docker compose up -d
```

| Port | Protocol | Used by |
|------|----------|---------|
| `1883` | MQTT/TCP | ESP32 devices, Next.js backend |
| `9001` | MQTT/WS  | Browser, caregiver app |

MQTT topic convention:
```
kinglae/device/{mac_address}/event
```

Example device payload:
```json
{
  "mac_address": "ESP32-001",
  "action": "BUTTON_PRESS",
  "button_color": "RED",
  "battery_level": 85,
  "timestamp": 1709044237
}
```

Button mapping: `RED → SOS`, `YELLOW → ASSIST`, `GREEN → MORNING_WAKEUP`

### 4. Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Scripts

```bash
# Apply DB schema
DATABASE_URI="..." node scripts/migrate.js

# Start MQTT broker
docker compose up -d

# View broker logs
docker compose logs -f mqtt

# Stop broker
docker compose down
```
