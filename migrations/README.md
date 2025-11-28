# Database Setup Guide

## Summary

**✅ No database migration needed for WebSocket functionality!**

WebSockets work at the application layer and don't require any database schema changes. Your existing database schema already supports all WebSocket features.

## Database Schema Status

Your current schema (`schema.sql`) already includes:

### Tables
- ✅ `teams` - Team management
- ✅ `event_config` - Global configuration (timer, notes, layout, actions)
- ✅ `audit_logs` - Admin action tracking

### WebSocket-Related Fields (Already Present)
- ✅ `action_counter` - Triggers one-time actions
- ✅ `last_action_payload` - Stores action data
- ✅ `timer_font_size` - Timer styling
- ✅ `timer_color` - Timer color
- ✅ All note styling fields
- ✅ `layout` - Layout configuration

## Existing Migrations

### 1. `add_timer_styling.sql`
Adds timer customization fields:
- `timer_font_size` (default: 64)
- `timer_color` (default: #ffffff)

**Status**: Should already be applied if you're using timer styling features.

## How to Verify Your Database

### Option 1: Run Verification Script
```bash
# In your Supabase SQL Editor, run:
migrations/verify_schema.sql
```

This will check:
- All required tables exist
- All required columns exist
- event_config row is initialized
- Display current schema and data

### Option 2: Manual Check
In Supabase SQL Editor:
```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('teams', 'event_config', 'audit_logs');

-- Check event_config columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'event_config'
ORDER BY ordinal_position;

-- Check if event_config row exists
SELECT * FROM event_config WHERE id = 1;
```

## Initial Setup (If Starting Fresh)

If you haven't set up the database yet:

### Step 1: Create Tables
```bash
# Run in Supabase SQL Editor:
schema.sql
```

### Step 2: Apply Migrations
```bash
# Run in Supabase SQL Editor:
migrations/add_timer_styling.sql
```

### Step 3: Verify
```bash
# Run in Supabase SQL Editor:
migrations/verify_schema.sql
```

## Migration History

| Date | File | Description | Required for WebSocket? |
|------|------|-------------|------------------------|
| Initial | `schema.sql` | Base schema with teams, config, audit | ✅ Yes |
| 2025-11-27 | `add_timer_styling.sql` | Timer font size & color | ❌ No (optional styling) |

## WebSocket Implementation Details

### What WebSockets Do
1. **Listen for database changes** via Supabase Realtime
2. **Broadcast events** when admin makes changes
3. **Trigger page refreshes** on all connected clients

### What WebSockets Don't Need
- ❌ No new tables
- ❌ No new columns
- ❌ No schema modifications
- ❌ No stored procedures
- ❌ No triggers

### How It Works
```
Admin Panel (Browser)
  ↓ Makes change via API
Flask Backend
  ↓ Updates Supabase database
  ↓ Calls trigger_refresh()
Flask-SocketIO
  ↓ Broadcasts 'refresh_page' event
All Connected Clients
  ↓ Receive event via WebSocket
  ↓ Reload page automatically
Display Pages (All Devices)
  ↓ Show updated data
```

## Troubleshooting

### "event_config row doesn't exist"
```sql
INSERT INTO event_config (id) VALUES (1);
```

### "Missing timer_font_size column"
Run the migration:
```sql
-- migrations/add_timer_styling.sql
ALTER TABLE event_config ADD COLUMN timer_font_size integer DEFAULT 64;
ALTER TABLE event_config ADD COLUMN timer_color text DEFAULT '#ffffff';
```

### "Tables don't exist"
Run the base schema:
```sql
-- schema.sql (run the entire file)
```

## Testing Database Connection

Run this Python script to test your database connection:

```python
# test_db_connection.py
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(url, key)

# Test connection
try:
    result = supabase.table('event_config').select('*').eq('id', 1).single().execute()
    print("✅ Database connection successful!")
    print(f"Config: {result.data}")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
```

## Next Steps

1. ✅ Verify your database has all required tables and columns
2. ✅ Run `migrations/verify_schema.sql` to confirm
3. ✅ Start the Flask server: `python app.py`
4. ✅ Test WebSocket functionality!

**No database changes needed - you're ready to go!** 🚀
