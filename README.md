All Data (all_data_field.html) → localStorage key: all_data_field_cache_v1
Datalist (datalist.html) → localStorage key: datalist_rows_v2

localstore data > all_data_field_cache_v1
localstore data > datalist_rows_v2

---
Admission Dashboard Notes (security & architecture)
1. The admission dashboard (`admission/admission_dashboard.html`) uses a public anon key placeholder. Replace `public-anon-key-placeholder` with your real anon key OR (recommended) proxy all Supabase requests through a secured backend with Row Level Security (RLS) enabled.
2. Enable RLS on table `admission_data` and add policies so only authorized service roles (or specific authenticated roles) can insert/update/delete.
3. Never expose service_role key in browser code.
4. Caching: admission dashboard keeps a 5‑minute localStorage cache key: `admission_data_cache_v1` for faster reload; clear via DevTools or change suffix to invalidate.
5. Batch pagination logic loads 1000 rows per request; adjust `batch` in the dashboard if table grows large (>50k) to avoid long initial fetch.
6. Consider adding an index on `(session, admisson_class, admission_section)` to speed filtering queries server-side if you move filtering to RPC.


