# Caregiver API Summary

This document provides a comprehensive overview of all caregiver-related APIs in the Kinglae application.

---

## Table of Contents

1. [Caregiver Management APIs](#caregiver-management-apis)
2. [Event Management APIs](#event-management-apis)
3. [Event State Flow](#event-state-flow)

---

## Caregiver Management APIs

### 1. List All Caregivers

**Endpoint:** `GET /api/caregivers`

**Description:** Retrieves all caregivers from the database, ordered by creation date (newest first).

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "string",
    "phone": "string | null",
    "created_at": "ISO datetime"
  }
]
```

**Status Codes:**
- `200` - Success
- `500` - Server error

---

### 2. Create Caregiver

**Endpoint:** `POST /api/caregivers`

**Description:** Creates a new caregiver record.

**Request Body:**
```json
{
  "name": "string (required)",
  "phone": "string (optional)"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "string",
  "phone": "string | null",
  "created_at": "ISO datetime"
}
```

**Status Codes:**
- `201` - Created successfully
- `400` - Validation error (name is required)
- `500` - Server error

---

### 3. Get Caregiver by ID

**Endpoint:** `GET /api/caregivers/{id}`

**Description:** Retrieves a specific caregiver by their ID.

**Parameters:**
- `id` (path) - The UUID of the caregiver

**Response:**
```json
{
  "id": "uuid",
  "name": "string",
  "phone": "string | null",
  "created_at": "ISO datetime"
}
```

**Status Codes:**
- `200` - Success
- `404` - Caregiver not found

---

### 4. Update Caregiver

**Endpoint:** `PUT /api/caregivers/{id}`

**Description:** Updates an existing caregiver's information.

**Parameters:**
- `id` (path) - The UUID of the caregiver

**Request Body:**
```json
{
  "name": "string",
  "phone": "string"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "string",
  "phone": "string | null",
  "created_at": "ISO datetime"
}
```

**Status Codes:**
- `200` - Updated successfully
- `500` - Server error

---

### 5. Delete Caregiver

**Endpoint:** `DELETE /api/caregivers/{id}`

**Description:** Deletes a caregiver from the database.

**Parameters:**
- `id` (path) - The UUID of the caregiver

**Response:** Empty body with status code 204

**Status Codes:**
- `204` - Deleted successfully
- `500` - Server error

---

## Event Management APIs

### 1. List All Events

**Endpoint:** `GET /api/events`

**Description:** Retrieves all events with optional filtering. Returns related device and caregiver information.

**Query Parameters:**
- `status` (optional) - Filter by event status (`PENDING`, `ACKNOWLEDGED`, `RESOLVED`, `COMPLETED`)
- `event_type` (optional) - Filter by event type
- `device_mac` (optional) - Filter by device MAC address

**Response:**
```json
[
  {
    "id": "uuid",
    "device_mac": "string",
    "event_type": "string",
    "status": "PENDING | ACKNOWLEDGED | RESOLVED | COMPLETED",
    "acknowledged_by": "uuid | null",
    "acknowledged_at": "ISO datetime | null",
    "resolved_at": "ISO datetime | null",
    "caregiver_note": "string | null",
    "created_at": "ISO datetime",
    "devices": {
      "mac_address": "string",
      "patient_id": "uuid"
    },
    "caregivers": {
      "id": "uuid",
      "name": "string"
    }
  }
]
```

**Status Codes:**
- `200` - Success
- `500` - Server error

---

### 2. Get Event by ID

**Endpoint:** `GET /api/events/{id}`

**Description:** Retrieves detailed information about a specific event including related device, patient, and caregiver data.

**Parameters:**
- `id` (path) - The UUID of the event

**Response:**
```json
{
  "id": "uuid",
  "device_mac": "string",
  "event_type": "string",
  "status": "PENDING | ACKNOWLEDGED | RESOLVED | COMPLETED",
  "acknowledged_by": "uuid | null",
  "acknowledged_at": "ISO datetime | null",
  "resolved_at": "ISO datetime | null",
  "caregiver_note": "string | null",
  "created_at": "ISO datetime",
  "devices": {
    "mac_address": "string",
    "patient_id": "uuid",
    "state": "IDLE | ALERT_ACTIVE | CAREGIVER_ON_THE_WAY",
    "patients": {
      "id": "uuid",
      "name": "string"
    }
  },
  "caregivers": {
    "id": "uuid",
    "name": "string",
    "phone": "string | null"
  }
}
```

**Status Codes:**
- `200` - Success
- `404` - Event not found

---

### 3. Create Event

**Endpoint:** `POST /api/events`

**Description:** Creates a new event (typically triggered by device sensors). New events are created with `PENDING` status.

**Request Body:**
```json
{
  "device_mac": "string (required)",
  "event_type": "string (required)"
}
```

**Response:**
```json
{
  "id": "uuid",
  "device_mac": "string",
  "event_type": "string",
  "status": "PENDING",
  "created_at": "ISO datetime"
}
```

**Status Codes:**
- `201` - Created successfully
- `400` - Validation error
- `500` - Server error

---

### 4. Acknowledge Event

**Endpoint:** `POST /api/events/{id}/acknowledge` or `PATCH /api/events/{id}/acknowledge`

**Description:** Marks an event as acknowledged by a caregiver. This indicates the caregiver has accepted the task and is on their way.

**State Transition:** `PENDING` → `ACKNOWLEDGED`

**Parameters:**
- `id` (path) - The UUID of the event

**Request Body:**
```json
{
  "caregiver_id": "uuid (optional)"
}
```

**Side Effects:**
1. Updates event status to `ACKNOWLEDGED`
2. Sets `acknowledged_at` timestamp
3. Sets `acknowledged_by` caregiver ID
4. Updates device state to `CAREGIVER_ON_THE_WAY`
5. **Sends LINE notification** to patient's relative with message:
   ```
   🏃‍♂️ ข่าวดี: มีเจ้าหน้าที่กดรับงานแล้ว!
   ผู้ป่วย: [patient name]
   สถานะ: กำลังเดินทางไปหาครับ
   ```

**Response:**
```json
{
  "id": "uuid",
  "status": "ACKNOWLEDGED",
  "acknowledged_by": "uuid",
  "acknowledged_at": "ISO datetime",
  ...
}
```

**Status Codes:**
- `200` - Success
- `404` - Event not found
- `409` - Invalid state transition
- `500` - Server error

---

### 5. Resolve Event

**Endpoint:** `POST /api/events/{id}/resolve` or `PATCH /api/events/{id}/resolve`

**Description:** Marks an acknowledged event as resolved (caregiver has arrived and provided initial care). Caregiver can add notes at this stage.

**State Transition:** `ACKNOWLEDGED` → `RESOLVED`

**Parameters:**
- `id` (path) - The UUID of the event

**Request Body:**
```json
{
  "caregiver_note": "string (optional)",
  "notes": "string (optional)"
}
```

**Side Effects:**
1. Updates event status to `RESOLVED`
2. Sets `resolved_at` timestamp
3. Stores caregiver note (accepts either `caregiver_note` or `notes` field)
4. Resets device state to `IDLE`

**Response:**
```json
{
  "id": "uuid",
  "status": "RESOLVED",
  "resolved_at": "ISO datetime",
  "caregiver_note": "string | null",
  ...
}
```

**Status Codes:**
- `200` - Success
- `404` - Event not found
- `409` - Invalid state transition
- `500` - Server error

---

### 6. Complete Event

**Endpoint:** `POST /api/events/{id}/complete` or `PATCH /api/events/{id}/complete`

**Description:** Marks a resolved event as completed (caregiver has finished their report). This is the final state in the event lifecycle.

**State Transition:** `RESOLVED` → `COMPLETED`

**Parameters:**
- `id` (path) - The UUID of the event

**Request Body:**
```json
{
  "caregiver_note": "string (optional)",
  "notes": "string (optional)"
}
```

**Side Effects:**
1. Updates event status to `COMPLETED`
2. Stores/updates caregiver note (accepts either `caregiver_note` or `notes` field)
3. Resets device state to `IDLE`
4. **Sends LINE notification** to patient's relative with message:
   ```
   ✅ แจ้งเตือน: เจ้าหน้าที่ทำการดูแลเสร็จสิ้นแล้ว
   ผู้ป่วย: [patient name]
   สถานะ: ปลอดภัย (อุปกรณ์พร้อมใช้งาน)
   ```

**Response:**
```json
{
  "id": "uuid",
  "status": "COMPLETED",
  "caregiver_note": "string | null",
  ...
}
```

**Status Codes:**
- `200` - Success
- `404` - Event not found
- `409` - Invalid state transition
- `500` - Server error

---

### 7. Cancel Event

**Endpoint:** `POST /api/events/{id}/cancel` or `PATCH /api/events/{id}/cancel`

**Description:** Cancels an event (available for pending events).

**Parameters:**
- `id` (path) - The UUID of the event

**Status Codes:**
- `200` - Success
- `404` - Event not found
- `500` - Server error

---

## Event State Flow

The following diagram shows the complete lifecycle of an event:

```
┌──────────┐
│ PENDING  │ ← Created by device/trigger
└────┬─────┘
     │
     │ Acknowledge ( caregiver accepts )
     ▼
┌─────────────────┐
│ ACKNOWLEDGED    │ → LINE: "Caregiver on the way"
└────┬────────────┘
     │
     │ Resolve (caregiver arrives/provides care)
     ▼
┌──────────┐
│ RESOLVED │
└────┬─────┘
     │
     │ Complete (caregiver finishes report)
     ▼
┌───────────┐
│ COMPLETED │ → LINE: "Care completed, device ready"
└───────────┘
```

### Device State Correlation

| Event Status | Device State |
|--------------|--------------|
| PENDING | ALERT_ACTIVE |
| ACKNOWLEDGED | CAREGIVER_ON_THE_WAY |
| RESOLVED | IDLE |
| COMPLETED | IDLE |

### LINE Notification Triggers

| Action | Trigger | Recipient |
|--------|---------|-----------|
| Caregiver accepts task | Event acknowledged | Patient's relative |
| Caregiver completes report | Event completed | Patient's relative |

---

## Environment Variables Required

For LINE notifications to work, ensure the following is set in your `.env` file:

```env
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
```

The `relative_line_id` must be associated with a patient in the database for notifications to be delivered.

---

## Database Schema (References)

### Caregivers Table
- `id` (uuid, primary key)
- `name` (text)
- `phone` (text, nullable)
- `created_at` (timestamp)

### Events Table
- `id` (uuid, primary key)
- `device_mac` (text, foreign key)
- `event_type` (text)
- `status` (enum: PENDING, ACKNOWLEDGED, RESOLVED, COMPLETED)
- `acknowledged_by` (uuid, foreign key to caregivers, nullable)
- `acknowledged_at` (timestamp, nullable)
- `resolved_at` (timestamp, nullable)
- `caregiver_note` (text, nullable)
- `created_at` (timestamp)

### Devices Table
- `mac_address` (text, primary key)
- `patient_id` (uuid, foreign key)
- `state` (enum: IDLE, ALERT_ACTIVE, CAREGIVER_ON_THE_WAY)

---

*Generated: 2026-03-01*
