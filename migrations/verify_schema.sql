-- Schema Verification Script
-- Run this to verify your database has all required columns for WebSocket functionality
-- Date: 2025-11-27

-- Check if all required columns exist in event_config table
DO $$
DECLARE
  missing_columns text[];
BEGIN
  -- Check for required columns
  SELECT array_agg(column_name)
  INTO missing_columns
  FROM (
    SELECT unnest(ARRAY[
      'timer_font_size',
      'timer_color',
      'note_font_size',
      'note_glow_color',
      'note_glow_intensity',
      'note_bold',
      'action_counter',
      'last_action_payload'
    ]) AS column_name
  ) expected
  WHERE column_name NOT IN (
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'event_config'
  );

  IF array_length(missing_columns, 1) > 0 THEN
    RAISE NOTICE 'Missing columns in event_config: %', array_to_string(missing_columns, ', ');
    RAISE NOTICE 'Please run the migration: add_timer_styling.sql';
  ELSE
    RAISE NOTICE '✅ All required columns exist in event_config table';
  END IF;
END $$;

-- Verify event_config row exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM event_config WHERE id = 1) THEN
    RAISE NOTICE '⚠️  event_config row does not exist. Inserting default row...';
    INSERT INTO event_config (id) VALUES (1);
    RAISE NOTICE '✅ Default event_config row created';
  ELSE
    RAISE NOTICE '✅ event_config row exists';
  END IF;
END $$;

-- Display current schema for event_config
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'event_config'
ORDER BY ordinal_position;

-- Display current event_config values
SELECT * FROM event_config WHERE id = 1;

-- Verify tables exist
DO $$
DECLARE
  missing_tables text[];
BEGIN
  SELECT array_agg(table_name)
  INTO missing_tables
  FROM (
    SELECT unnest(ARRAY['teams', 'event_config', 'audit_logs']) AS table_name
  ) expected
  WHERE table_name NOT IN (
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  );

  IF array_length(missing_tables, 1) > 0 THEN
    RAISE NOTICE '❌ Missing tables: %', array_to_string(missing_tables, ', ');
    RAISE NOTICE 'Please run schema.sql to create the database';
  ELSE
    RAISE NOTICE '✅ All required tables exist (teams, event_config, audit_logs)';
  END IF;
END $$;

-- Summary
SELECT 
  '✅ Schema verification complete!' AS status,
  (SELECT COUNT(*) FROM teams) AS total_teams,
  (SELECT COUNT(*) FROM audit_logs) AS total_audit_logs;
