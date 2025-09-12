<?php
// Server-side endpoint: fetch student rows from Supabase and output an HTML table
// This produces static HTML (no client JS required), so Google Sheets =IMPORTHTML("<url>","table",1) can import it.

$supabaseUrl = 'https://rtfefxghfbtirfnlbucb.supabase.co';
$anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0ZmVmeGdoZmJ0aXJmbmxidWNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1MDg3OTcsImV4cCI6MjA1NjA4NDc5N30.fb7_myCmFzbV7WPNjFN_NEl4z0sOmRCefnkQbk6c10w';

$select = 'iid,father_number,session,class_2025,section_2025,roll_2025,class_2026,section_2026,roll_2026,status';
$endpoint = $supabaseUrl . '/rest/v1/student_database?select=' . urlencode($select) . '&order=iid';

$ch = curl_init($endpoint);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  'apikey: ' . $anonKey,
  'Authorization: Bearer ' . $anonKey,
  'Accept: application/json',
]);

$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
if($response === false || $httpcode >= 400){
  http_response_code(500);
  header('Content-Type: text/plain; charset=utf-8');
  echo "Error fetching data from Supabase (HTTP {$httpcode})";
  exit;
}

$data = json_decode($response, true);
if($data === null){
  http_response_code(500);
  header('Content-Type: text/plain; charset=utf-8');
  echo "Invalid JSON response from Supabase";
  exit;
}

header('Content-Type: text/html; charset=utf-8');
echo "<!doctype html><html><head><meta charset='utf-8'><title>Student Table (static)</title>";
echo "<style>body{font-family:Arial,Helvetica,sans-serif;padding:12px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px;text-align:left}th{background:#f4f6f8}</style>";
echo "</head><body>";
echo "<h2>Students (static table)</h2>";
echo "<table><thead><tr><th>SL</th><th>iid</th><th>father_number</th><th>class_section_year</th><th>active_roll</th><th>active_class</th><th>active_section</th><th>session</th></tr></thead><tbody>";

$idx = 0;
foreach($data as $row){
  if(isset($row['status']) && stripos($row['status'], 'TC') !== false) continue; // skip TC
  $idx++;
  $iid = htmlspecialchars($row['iid'] ?? '');
  $father = htmlspecialchars($row['father_number'] ?? '');
  $session = $row['session'] ?? '';

  $active_roll = $active_class = $active_section = '';
  if(is_numeric($session) && intval($session) === 2026){
    $active_roll = $row['roll_2026'] ?? '';
    $active_class = $row['class_2026'] ?? '';
    $active_section = $row['section_2026'] ?? '';
  }elseif(is_numeric($session) && intval($session) === 2025){
    $active_roll = $row['roll_2025'] ?? '';
    $active_class = $row['class_2025'] ?? '';
    $active_section = $row['section_2025'] ?? '';
  }

  $csY = '';
  if($active_class !== '' || $active_section !== '' || $session !== ''){
    $csY = htmlspecialchars(($active_class ?? '') . '-' . ($active_section ?? '') . '-' . ($session ?? ''));
  }

  echo "<tr>";
  echo "<td>" . $idx . "</td>";
  echo "<td>" . $iid . "</td>";
  echo "<td>" . $father . "</td>";
  echo "<td>" . $csY . "</td>";
  echo "<td>" . htmlspecialchars($active_roll) . "</td>";
  echo "<td>" . htmlspecialchars($active_class) . "</td>";
  echo "<td>" . htmlspecialchars($active_section) . "</td>";
  echo "<td>" . htmlspecialchars($session) . "</td>";
  echo "</tr>";
}

echo "</tbody></table>";
echo "</body></html>";

?>
