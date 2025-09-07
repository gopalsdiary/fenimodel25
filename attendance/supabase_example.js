// Simple Node/JS example using fetch and Supabase REST API
// Requires Node 18+ (global fetch) or run in a browser environment.
// Set environment variables SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY if RLS allows).

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY) environment variables.');
  process.exit(1);
}

const table = 'attendence_entry';

async function insertEntry({ attendence_date, rfid_card_no, attendence_time }) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const body = [{ attendence_date, rfid_card_no, attendence_time }];

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify({ status: res.status, body: data }));
  return data;
}

async function fetchEntries(limit = 50) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  url.searchParams.set('select', '*');
  url.searchParams.set('order', 'attendence_sl.desc');
  url.searchParams.set('limit', String(limit));

  const res = await fetch(url.toString(), {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify({ status: res.status, body: data }));
  return data;
}

// Quick CLI demo: node supabase_example.js insert 2025-09-07 RFID123 08:30:00
// or: node supabase_example.js list

(async () => {
  const argv = process.argv.slice(2);
  try {
    if (argv[0] === 'insert') {
      const [attendence_date, rfid_card_no, attendence_time] = argv.slice(1);
      const inserted = await insertEntry({ attendence_date, rfid_card_no, attendence_time });
      console.log('Inserted:', inserted);
    } else {
      const rows = await fetchEntries(20);
      console.log('Latest entries:', rows);
    }
  } catch (err) {
    console.error('Error:', err);
  }
})();
