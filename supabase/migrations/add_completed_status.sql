-- Migration: Add COMPLETED status to event_status enum
-- This adds COMPLETED as a new status for events

-- Step 1: Add new value to the enum (PostgreSQL requires this approach)
ALTER TYPE event_status ADD VALUE IF NOT EXISTS 'COMPLETED';

-- Note: The enum values will now be in this order:
-- 'PENDING', 'ACKNOWLEDGED', 'RESOLVED', 'CANCELLED', 'COMPLETED'
