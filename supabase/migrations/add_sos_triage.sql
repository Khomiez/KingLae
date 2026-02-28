-- ============================================================
-- Migration: Add SOS Triage Fields to Events Table
-- ============================================================
-- Run this migration in order:

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

-- ============================================================
-- Verification Query (optional)
-- ============================================================
-- Run this to verify the migration worked:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'events'
-- AND column_name IN ('triage_decision', 'triage_by', 'triage_at', 'is_true_sos')
-- ORDER BY column_name;
