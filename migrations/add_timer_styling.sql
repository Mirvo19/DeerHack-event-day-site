-- Migration: Add Timer Styling Customization
-- Date: 2025-11-27
-- Description: Adds timer_font_size and timer_color columns to event_config table

-- Add timer_font_size column (default 64px)
ALTER TABLE event_config 
ADD COLUMN timer_font_size integer DEFAULT 64;

-- Add timer_color column (default white #ffffff)
ALTER TABLE event_config 
ADD COLUMN timer_color text DEFAULT '#ffffff';

-- Update the existing row with default values (if not already set)
UPDATE event_config 
SET 
  timer_font_size = COALESCE(timer_font_size, 64),
  timer_color = COALESCE(timer_color, '#ffffff')
WHERE id = 1;

-- Add comments for documentation
COMMENT ON COLUMN event_config.timer_font_size IS 'Font size of the timer display in pixels (24-200)';
COMMENT ON COLUMN event_config.timer_color IS 'Color of the timer display in hex format (e.g., #ffffff)';
