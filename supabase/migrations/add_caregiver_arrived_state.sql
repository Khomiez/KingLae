-- Migration: Add CAREGIVER_ARRIVED state to device_state enum
-- This adds CAREGIVER_ARRIVED as a new device state for tracking when caregiver is at patient location writing report

-- Step 1: Add new value to the enum (PostgreSQL requires this approach)
ALTER TYPE device_state ADD VALUE IF NOT EXISTS 'CAREGIVER_ARRIVED';

-- Note: The enum values will now be in this order:
-- 'IDLE', 'EMERGENCY', 'ASSIST_REQUESTED', 'WAITING_CAREGIVER_ACCEPT',
-- 'CAREGIVER_ON_THE_WAY', 'CAREGIVER_ARRIVED', 'MORNING_WINDOW', 'GRACE_PERIOD'
