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
│   ├── api/                # API routes (caregivers, patients, devices, events, mqtt)
│   ├── api-test/           # Interactive API tester page
│   └── page.tsx            # Homepage
├── lib/
│   └── supabase-server.ts  # Supabase server client
├── supabase/
│   └── schema.sql          # Database schema (source of truth)
├── scripts/
│   ├── seed.js             # Database seeder (Thai sample data)
│   ├── reset.js            # Delete all seed data
│   ├── verify.js           # Preview seeded data
│   └── mqtt_bridge.js      # MQTT → API bridge
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

## API Routes

### Caregivers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/caregivers` | List all caregivers |
| POST | `/api/caregivers` | Create caregiver (`name`, `phone`) |
| GET | `/api/caregivers/:id` | Get caregiver by ID |
| PUT | `/api/caregivers/:id` | Update caregiver |
| DELETE | `/api/caregivers/:id` | Delete caregiver |

### Patients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients` | List all patients |
| POST | `/api/patients` | Create patient (`name`, `date_of_birth`, `weight`, `height`, `symptoms`, `address`, `relative_line_id`) |
| GET | `/api/patients/:id` | Get patient by ID |
| PUT | `/api/patients/:id` | Update patient |
| DELETE | `/api/patients/:id` | Delete patient |

### Devices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/devices` | List all devices |
| POST | `/api/devices` | Create device (`mac_address`, `patient_id`, `battery_level`, `state`, `health`) |
| GET | `/api/devices/:mac` | Get device by MAC address |
| PUT | `/api/devices/:mac` | Update device |
| DELETE | `/api/devices/:mac` | Delete device |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List events (query: `status`, `event_type`, `device_mac`) |
| POST | `/api/events` | Create event (`device_mac`, `event_type`) |
| GET | `/api/events/:id` | Get event by ID |
| PATCH | `/api/events/:id/acknowledge` | Acknowledge event (`caregiver_id`) |
| PATCH | `/api/events/:id/resolve` | Resolve event (`caregiver_note`) |
| PATCH | `/api/events/:id/cancel` | Cancel event |

### MQTT
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/mqtt/event` | Receive MQTT event from bridge (`mac_address`, `action`, `button_color`, `battery_level`, `timestamp`) |

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

### 5. API Tester

Interactive API testing page available at `/api-test`:

- Sidebar with all 22 endpoints grouped by resource
- Form inputs for path params, query params, and request bodies
- Response viewer with status badges and pretty-printed JSON
- No auth required — perfect for development

```
http://localhost:3000/api-test
```

## Caregiver App

The caregiver app is a mobile-first web application for staff to monitor and respond to patient emergencies.

### Pages

| Page | Route | Purpose |
|------|-------|---------|
| Home | `/caregiver/home` | Main dashboard showing urgent tasks and patient list |
| Patient Info | `/caregiver/patient-info` | Patient profile with device status and recent history |
| To Confirm | `/caregiver/to-confirm` | Confirmation page after acknowledging an event |
| Write Report | `/caregiver/write-report` | Caregiver notes and completion form |
| History | `/caregiver/history` | Complete event history with filters |

### Event Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CAREGIVER APP EVENT FLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. PENDING (New Event)                                                    │
│     ┌─────────────────┐                                                    │
│     │ Patient presses │ ────────────────────────────────────────────┐     │
│     │ SOS/ASSIST btn  │                                              │     │
│     └─────────────────┘                                              │     │
│                           ▼                                              │     │
│     ┌──────────────────────────────────────────────────────────────┐    │     │
│     │  HOME PAGE                                                  │    │     │
│     │  • Shows "Urgent Tasks" section                             │    │     │
│     │  • Live elapsed time counter                                │    │     │
│     │  • Buttons: [ดูข้อมูลผู้ป่วย] [รับงาน/Acknowledge]         │    │     │
│     └──────────────────────────────────────────────────────────────┘    │     │
│                           │                                                  │
│                           │ Caregiver clicks "รับงาน"                       │
│                           ▼                                                  │
│                                                                             │
│  2. ACKNOWLEDGED (Caregiver on the way)                                   │
│     ┌──────────────────────────────────────────────────────────────┐     │
│     │  TO CONFIRM PAGE                                            │     │
│     │  • Shows patient info                                       │     │
│     │  • Location status: "อยู่ในพื้นที่บ้านผู้ป่วยแล้ว"        │     │
│     │  • Instructions: Press green button on device               │     │
│     │  • Status: "รอยืนยันจากอุปกรณ์..."                         │     │
│     │  • Real-time monitoring for status change                   │     │
│     │  • Manual confirmation link if device fails                 │     │
│     └──────────────────────────────────────────────────────────────┘     │
│                           │                                                  │
│                           │ Green button pressed OR manual confirmation     │
│                           ▼                                                  │
│                                                                             │
│  3. RESOLVED (Caregiver arrived, providing care)                           │
│     ┌──────────────────────────────────────────────────────────────┐     │
│     │  WRITE REPORT PAGE                                          │     │
│     │  • Shows patient info                                       │     │
│     │  • Event type badge (SOS/ASSIST)                            │     │
│     │  • Caregiver note textarea                                 │     │
│     │  • Quick tags: #ช่วยพยุง #เข้าห้องน้ำ #อุบัติเหตุ         │     │
│     │  • Submit button: "บันทึกและปิดงาน"                        │     │
│     └──────────────────────────────────────────────────────────────┘     │
│                           │                                                  │
│                           │ Caregiver submits notes                         │
│                           ▼                                                  │
│                                                                             │
│  4. COMPLETED (Task finished, caregiver note saved)                        │
│                           │                                                  │
│                           └──► Redirect to HOME PAGE                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Real-time Features

| Feature | Implementation |
|---------|---------------|
| Live event updates | Supabase Realtime subscription to `events` table |
| Device status | Realtime subscription to `devices` table |
| Connection indicator | Visual indicator (green/gray) in header |
| Polling fallback | 2-second interval when Realtime unavailable |
| Notifications | Browser notifications for new SOS/ASSIST events |
| Live elapsed time | Updates every second for PENDING events |

### Event Types & Statuses

| Event Type | Button | Priority |
|------------|--------|----------|
| `SOS` | Red | 🔴 Emergency - Immediate response required |
| `ASSIST` | Yellow | 🟡 General assistance - Normal response |
| `MORNING_WAKEUP` | Green | 🟢 Daily check-in - Informational |
| `MISSED_CHECKIN` | System | 🟠 Alert - Patient failed to check in |

| Status | Meaning |
|--------|---------|
| `PENDING` | New event, awaiting caregiver acknowledgment |
| `ACKNOWLEDGED` | caregiver accepted, on the way to patient |
| `RESOLVED` | Caregiver arrived at patient location |
| `COMPLETED` | Care finished, notes saved |
| `CANCELLED` | Event cancelled (false alarm, etc.) |

### Navigation

Bottom navigation bar with 4 tabs:

1. **หน้าหลัก (Home)** - Dashboard with urgent tasks and patient list
2. **ผู้ป่วย (Patients)** - Browse all patients, view details
3. **บันทึก (Write Report)** - Access caregiver notes form
4. **ประวัติ (History)** - View complete event history with filters

### Quick Actions

| Action | Location | Result |
|--------|----------|--------|
| รับงาน (Acknowledge) | Home page, urgent task card | Event → ACKNOWLEDGED, redirect to To Confirm |
| ดูข้อมูลผู้ป่วย (View Patient) | Home page, urgent task card | Navigate to Patient Info page |
| Manual confirmation | To Confirm page footer | Event → RESOLVED, redirect to Write Report |
| Submit notes | Write Report page | Event → COMPLETED, redirect to Home |

### Real-time Architecture

The caregiver app uses **Supabase Realtime** for instant updates, with a **polling fallback** when Realtime is unavailable.

#### Components

| Component | File | Purpose |
|-----------|------|---------|
| `CaregiverHomeClient` | `app/caregiver/home/components/` | Main client component with real-time event subscriptions |
| `CaregiverNav` | `app/caregiver/components/` | Bottom navigation bar |
| `AcknowledgeButton` | `app/caregiver/components/` | Button to acknowledge events |
| `EventNotification` | `app/caregiver/components/` | Toast notification system |
| `ConnectionStatus` | `app/caregiver/components/` | Visual connection indicator |

#### Custom Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useRealtimeEvents` | `app/caregiver/hooks/` | Subscribe to Supabase Realtime events and devices |
| `useEventNotifications` | `app/caregiver/hooks/` | Audio and browser notification management |
| `useEventNotificationsWithPrompt` | `app/caregiver/hooks/` | Auto-request notification permission on user interaction |

#### Connection States

| State | Indicator | Behavior |
|-------|-----------|----------|
| `connecting` | Yellow pulse | Initial connection attempt |
| `connected` | Green dot | Realtime active, no polling |
| `unavailable` | Gray dot | Realtime not enabled, using 2s polling fallback |
| `disconnected` | Red dot | Connection lost, attempting reconnect |
| `error` | Red dot | Connection error |

#### Enabling Realtime

To enable Supabase Realtime for the caregiver app:

1. Go to Supabase Dashboard → Database → Replication
2. Enable Realtime for `events` and `devices` tables
3. Select columns to broadcast (usually all columns)

If Realtime is not enabled, the app automatically falls back to 2-second polling.

#### Audio Notifications

| Event Type | Sound | Behavior |
|------------|-------|----------|
| SOS | SOS alert (urgent beep) | Plays twice, requires interaction |
| ASSIST | Gentle chime | Single notification sound |
| Mute toggle | - | Located in header, persists during session |

### 6. Database Seeding

Seed the database with realistic Thai home-care sample data:

```bash
npm run seed              # Generate Thai caregivers, patients, devices, events
npm run db:reset          # Delete all seed data
node scripts/verify.js    # Preview sample data
```

**Seeded data includes:**
- 8 caregivers with Thai names and phone numbers (08x/09x format)
- 15 patients (ages 59-91) with Thai addresses and medical conditions
- 15 IoT devices with various states and battery levels
- 60 events distributed across statuses (PENDING, ACKNOWLEDGED, RESOLVED, CANCELLED)

## Scripts

```bash
# Development
npm run dev                # Start Next.js dev server
npm run build              # Build for production
npm run start              # Start production server
npm run lint               # Run ESLint

# Database
DATABASE_URI="..." node scripts/migrate.js  # Apply DB schema
npm run seed                         # Seed with sample data
npm run db:reset                      # Delete all seed data
node scripts/verify.js                # Preview seeded data

# MQTT
docker compose up -d         # Start MQTT broker
docker compose logs -f mqtt  # View broker logs
docker compose down          # Stop broker
npm run mqtt-bridge          # Run MQTT → API bridge
```
