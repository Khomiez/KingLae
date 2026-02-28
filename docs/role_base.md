# Role-Based Platform Documentation

To demonstrate a complete technological ecosystem for healthy living and longevity, your prototype needs to clearly show how data flows between the people who need it.

Here is the high-level breakdown of the three platforms, what each role can do, and the primary API endpoints they will consume based on our simplified database structure.

---

## 1. Admin Web-App (รพ.สต. / Local Health Authority)

### The Role
This is the command center. Admins use this dashboard to oversee the entire community, monitor device health, analyze data, and manage resources to secure LTC funding.

### Key Prototype Features

| Feature | Description |
|---------|-------------|
| **System Dashboard** | View real-time statistics of online devices, active alerts, and completed morning check-ins |
| **Patient & Staff Registry** | Add new patients, assign them to caregivers, and register new IoT devices |
| **Device Monitoring** | Check battery levels and connection statuses to proactively replace batteries before a device goes offline |
| **Activity Auditing** | View the full timeline of all events across the community |

### Accessible APIs

```http
# Dashboard Statistics
GET /api/v1/stats/dashboard
# Returns: total patients, active emergencies, offline devices

# Device Management
GET /api/v1/devices
GET /api/v1/devices/health
# Returns: MAC addresses, battery %, and status

# Patient Management
GET /api/v1/patients
# Returns: patient list and their assigned caregivers

POST /api/v1/patients
# Creates: a new patient profile

# Event History
GET /api/v1/events
# Returns: master list of all historical events
```

---

## 2. Caregiver App (Nurses / Aides)

### The Role
This is the field tool. While ideally a mobile app with GPS, a responsive web-app works perfectly for the prototype. It allows caregivers to receive tasks, claim them, and log their care data.

### Key Prototype Features

| Feature | Description |
|---------|-------------|
| **Task List** | View a live feed of ACTIVE emergencies and assist requests |
| **Job Acknowledgement** | Tap "Accept" on an active alert. This locks the job to them and changes the database status to `ACKNOWLEDGED` |
| **Resolution & Note Taking** | After arriving and pressing the physical Green Button on the bed to log the exact response time, the app prompts the caregiver to type a post-care note (e.g., "Helped patient back to bed") |

### Accessible APIs

```http
# Task List
GET /api/v1/events?status=ACTIVE,ACKNOWLEDGED
# Fetches: caregiver's current to-do list

# Acknowledge Task
POST /api/v1/events/:id/acknowledge
# Updates: event status to ACKNOWLEDGED and assigns their caregiver_id

# Resolve Task
POST /api/v1/events/:id/resolve
# Submits: caregiver_note text to the database row after the physical Green button is pressed

# Patient Details
GET /api/v1/patients/:id
# Fetches: patient's address and medical details
```

---

## 3. Relatives Platform (LINE OA + LIFF)

### The Role
This platform keeps family members informed to reduce anxiety. Since it lives inside LINE, there is zero learning curve.

### Key Prototype Features

| Feature | Description |
|---------|-------------|
| **Instant Push Notifications** | Receives messages immediately when the Red or Yellow buttons are pressed |
| **Status Updates** | Receives a message when a caregiver acknowledges the job ("Staff is on the way") and when it is resolved ("Help provided") |
| **Morning Wake-up Tracker** | Receives a positive confirmation if the patient presses the green button between 05:00-09:00 AM |
| **Missed Check-in Warning** | Receives a warning message if the patient fails to press the wake-up button by 09:15 AM |
| **Activity Feed (LIFF Web-view)** | A simple embedded webpage inside LINE showing a timeline of the patient's button presses and caregiver visits |

### Accessible APIs

```http
# Backend Outbound (Push Notifications)
# Your backend doesn't wait for LINE to ask for data.
# When the ESP32 triggers an event, your backend proactively hits
# the LINE Messaging API to push the text to the relative's relative_line_id.

# LIFF App Inbound (Activity Feed)
GET /api/v1/events?device_mac={mac}
# The LIFF app fetches this to display the historical timeline to the family.
```

---

## Data Flow Summary

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   ESP32     │────────▶│  Backend    │────────▶│ LINE API    │
│  (Device)   │  MQTT   │  (Server)   │  Push   │ (Relatives) │
└─────────────┘         └─────────────┘         └─────────────┘
                               │
                               ▼
                        ┌─────────────┐
                        │   Database  │
                        └─────────────┘
                               ▲
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
              ┌─────────────┐       ┌─────────────┐
              │   Admin     │       │ Caregiver   │
              │  Dashboard  │       │    App      │
              └─────────────┘       └─────────────┘
```