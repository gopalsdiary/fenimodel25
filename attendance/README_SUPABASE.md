Quick guide — connect this project to Supabase and create the attendance table

1) Create the table in Supabase
- Open your Supabase project -> SQL Editor -> New query.
- Paste the SQL from `attendance/sql/create_attendence_entry.sql` and run it.

2) Environment variables
- You need the project URL and a key. For local testing use the Service Role key (keep it secret).
  - SUPABASE_URL = https://your-project-ref.supabase.co
  - SUPABASE_SERVICE_KEY = <service_role_key>
  - Or use SUPABASE_ANON_KEY if your table allows anon inserts via RLS.

PowerShell example (Windows):

$env:SUPABASE_URL = "https://your-project-ref.supabase.co"
$env:SUPABASE_SERVICE_KEY = "your_service_role_key_here"
node attendance/supabase_example.js insert 2025-09-07 RFID123 08:30:00

To list recent entries:

$env:SUPABASE_URL = "https://your-project-ref.supabase.co"
$env:SUPABASE_SERVICE_KEY = "your_service_role_key_here"
node attendance/supabase_example.js

Notes:
- Using the service role key bypasses Row Level Security; do not ship this key to browsers.
- For production web apps, use Supabase client libraries and server endpoints that keep the service key secret.
- If you want, I can create a Next.js API route or a small server script to wrap these operations safely.
