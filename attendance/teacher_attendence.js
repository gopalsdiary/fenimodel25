const SUPABASE_URL = 'https://rtfefxghfbtirfnlbucb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0ZmVmeGdoZmJ0aXJmbmxidWNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1MDg3OTcsImV4cCI6MjA1NjA4NDc5N30.fb7_myCmFzbV7WPNjFN_NEl4z0sOmRCefnkQbk6c10w';

let supabaseClient;
if (window.supabase && typeof window.supabase.createClient === 'function') {
  window.__supabaseClients = window.__supabaseClients || {};
  supabaseClient = window.__supabaseClients[SUPABASE_URL] || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.__supabaseClients[SUPABASE_URL] = supabaseClient;
} else {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const tableBody = document.querySelector('#reportTable tbody');
const statusEl = document.getElementById('status');
const errorEl = document.getElementById('error');
const dateFilter = document.getElementById('dateFilter');
const totalCountEl = document.getElementById('totalCount');
const presentCountEl = document.getElementById('presentCount');
const absentCountEl = document.getElementById('absentCount');
const teacherDayModal = document.getElementById('teacherDayModal');
const teacherDayTitle = document.getElementById('teacherDayTitle');
const teacherDayMeta = document.getElementById('teacherDayMeta');
const teacherDayBody = document.getElementById('teacherDayBody');

let iidToRfidMap = new Map();
let teacherMetaByIid = new Map();
let currentTeacherReportRows = [];
let currentTeacherName = '';
let currentTeacherIid = '';

// accessibility: remember last focused element before opening modal
let lastFocusedElement = null;

const today = new Date().toISOString().split('T')[0];
dateFilter.value = today;

function updatePageTitle() {
  const selectedDate = new Date(dateFilter.value + 'T00:00:00');
  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const titleElement = document.getElementById('pageTitle');
  if (titleElement) {
    titleElement.textContent = `📅 ${formattedDate} Attendance`;
  }
}

function formatTime(timeStr) {
  if (!timeStr) return '-';
  if (String(timeStr).includes(':')) {
    const [hours, minutes] = String(timeStr).split(':');
    const hour24 = parseInt(hours, 10);
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }
  return String(timeStr);
}

function formatDateHuman(yyyyMmDd) {
  if (!yyyyMmDd) return '-';
  const date = new Date(yyyyMmDd + 'T00:00:00');
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function closeTeacherDayModal() {
  // blur any focused element inside modal first to avoid aria-hidden warning
  const activeInside = teacherDayModal.querySelector(':focus');
  if (activeInside && typeof activeInside.blur === 'function') {
    activeInside.blur();
  }
  // return focus to the element that opened the modal (or other previous focus)
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus();
  }
  teacherDayModal.classList.remove('show');
  teacherDayModal.setAttribute('aria-hidden', 'true');
  lastFocusedElement = null;
}

function updatePrintValues() {
  const printClassEl = document.getElementById('printClass');
  const printSectionEl = document.getElementById('printSection');
  const printDateEl = document.getElementById('printDate');
  const printTimeEl = document.getElementById('printTime');
  const classValue = 'Teachers';
  const sectionValue = 'All';
  const dateValue = dateFilter ? dateFilter.value : '';

  if (printClassEl) {
    printClassEl.textContent = classValue || 'Not Selected';
  }
  if (printSectionEl) {
    printSectionEl.textContent = sectionValue || 'Not Selected';
  }
  if (printDateEl) {
    let text = 'Not Selected';
    if (dateValue) {
      try {
        const selectedDate = new Date(dateValue + 'T00:00:00');
        text = selectedDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (error) {
        console.error('Date formatting error:', error);
      }
    }
    printDateEl.textContent = text;
  }
  if (printTimeEl) {
    printTimeEl.textContent = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
}

async function loadEntries() {
  statusEl.textContent = 'Loading...';
  errorEl.style.display = 'none';

  try {
    const { data: teachers, error: teacherError } = await supabaseClient
      .from('teacher_database')
      .select('iid, teacher_name_en, teacher_name_bn')
      .order('iid', { ascending: true });

    if (teacherError) throw teacherError;

    const { data: studentRfidRows, error: rfidError } = await supabaseClient
      .from('student_database')
      .select('iid, rfid_card_no')
      .not('rfid_card_no', 'is', null);

    if (rfidError) throw rfidError;

    const iidToRfid = new Map();
    (studentRfidRows || []).forEach((row) => {
      const iidKey = row?.iid == null ? '' : String(row.iid).trim();
      const rfidValue = row?.rfid_card_no == null ? '' : String(row.rfid_card_no).trim();
      if (iidKey && rfidValue) {
        iidToRfid.set(iidKey, rfidValue);
      }
    });

    iidToRfidMap = iidToRfid;
    teacherMetaByIid = new Map();
    (teachers || []).forEach((teacher) => {
      const key = teacher?.iid == null ? '' : String(teacher.iid).trim();
      if (key) {
        teacherMetaByIid.set(key, {
          iid: key,
          name: teacher.teacher_name_en || teacher.teacher_name_bn || '-',
          rfid: iidToRfid.get(key) || ''
        });
      }
    });

    const selectedDate = dateFilter.value;
    const { data: attendanceData, error: attendanceError } = await supabaseClient
      .from('attendence_entry')
      .select('*')
      .eq('attendence_date', selectedDate)
      .order('attendence_time', { ascending: true });

    if (attendanceError) throw attendanceError;

    const rfidScans = new Map();
    (attendanceData || []).forEach((entry) => {
      const rfid = entry.rfid_card_no;
      if (!rfid) return;
      if (!rfidScans.has(rfid)) {
        rfidScans.set(rfid, { first: entry.attendence_time, last: entry.attendence_time });
      } else {
        rfidScans.get(rfid).last = entry.attendence_time;
      }
    });

    tableBody.innerHTML = '';
    if (!teachers || teachers.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="muted">No teachers found. 📭</td></tr>';
      statusEl.textContent = 'No teachers found';
      totalCountEl.textContent = '0';
      presentCountEl.textContent = '0';
      absentCountEl.textContent = '0';
      return;
    }

    let presentCount = 0;
    let rowNumber = 0;

    for (const teacher of teachers) {
      rowNumber += 1;
      const tr = document.createElement('tr');
      const teacherIidKey = teacher?.iid == null ? '' : String(teacher.iid).trim();
      const teacherRfid = iidToRfid.get(teacherIidKey) || '';
      const hasRfid = teacherRfid !== '';
      const scans = hasRfid ? rfidScans.get(teacherRfid) : null;
      const inTime = scans ? formatTime(scans.first) : '-';
      const outTime = scans ? formatTime(scans.last) : '-';
      const isPresent = !!scans;
      if (isPresent) presentCount += 1;

      const rollDisplay = hasRfid ? rowNumber : `${rowNumber}<span class="no-rfid-marker">*</span>`;
      const teacherName = teacher.teacher_name_en || teacher.teacher_name_bn || '-';
      const teacherSafeIid = teacher?.iid == null ? '' : String(teacher.iid).replace(/"/g, '&quot;');
      const teacherSafeName = String(teacherName).replace(/"/g, '&quot;');

      tr.innerHTML = `
        <td class="col-center">${rollDisplay}</td>
        <td class="col-center">${teacher.iid ?? '-'}</td>
        <td class="student-name"><span class="teacher-link" data-iid="${teacherSafeIid}" data-name="${teacherSafeName}">${teacherName}</span></td>
        <td class="time-display">${inTime}</td>
        <td class="time-display">${outTime}</td>
      `;
      if (isPresent) {
        tr.style.backgroundColor = '#d1fae5';
      }
      tableBody.appendChild(tr);
    }

    const totalTeachers = teachers.length;
    const absentCount = totalTeachers - presentCount;
    totalCountEl.textContent = totalTeachers;
    presentCountEl.textContent = presentCount;
    absentCountEl.textContent = absentCount;
    statusEl.textContent = `Loaded ${totalTeachers} teachers (${presentCount} present, ${absentCount} absent) ✅`;
  } catch (error) {
    console.error(error);
    errorEl.style.display = 'block';
    errorEl.textContent = 'Error loading data: ' + (error.message || JSON.stringify(error));
    statusEl.textContent = 'Error';
  }
}

async function openTeacherDayReport(iid, fallbackName) {
  currentTeacherReportRows = [];
  currentTeacherIid = iid;

  const teacherMeta = teacherMetaByIid.get(iid) || {
    iid,
    name: fallbackName || 'Teacher',
    rfid: iidToRfidMap.get(iid) || ''
  };

  currentTeacherName = teacherMeta.name || 'Teacher';
  teacherDayTitle.textContent = `Day-wise Report: ${currentTeacherName}`;
  teacherDayMeta.textContent = `IID: ${iid || '-'} | RFID: ${teacherMeta.rfid || 'Not Assigned'}`;
  teacherDayBody.innerHTML = '<div class="modal-empty">Loading teacher report...</div>';

  // accessibility: store previous focus then move focus into modal
  lastFocusedElement = document.activeElement;
  teacherDayModal.classList.add('show');
  teacherDayModal.setAttribute('aria-hidden', 'false');
  // give focus to close button after showing
  setTimeout(() => {
    const btn = document.getElementById('closeTeacherDayBtn');
    if (btn) btn.focus();
  }, 0);

  if (!teacherMeta.rfid) {
    teacherDayBody.innerHTML = '<div class="modal-empty">এই শিক্ষকের RFID record পাওয়া যায়নি / IID matching</div>';
    return;
  }

  try {
    const { data: entries, error } = await supabaseClient
      .from('attendence_entry')
      .select('attendence_date, attendence_time, rfid_card_no')
      .eq('rfid_card_no', teacherMeta.rfid)
      .order('attendence_date', { ascending: false })
      .order('attendence_time', { ascending: true });

    if (error) throw error;

    const byDate = new Map();
    (entries || []).forEach((entry) => {
      const date = entry.attendence_date || '';
      if (!date) return;
      if (!byDate.has(date)) {
        byDate.set(date, { date, first: entry.attendence_time, last: entry.attendence_time, scans: 1 });
      } else {
        const old = byDate.get(date);
        old.last = entry.attendence_time;
        old.scans += 1;
      }
    });

    currentTeacherReportRows = Array.from(byDate.values()).sort((first, second) => second.date.localeCompare(first.date));
    if (currentTeacherReportRows.length === 0) {
      teacherDayBody.innerHTML = '<div class="modal-empty">কোনো attendance record পাওয়া যায়নি।</div>';
      return;
    }

    const rowsHtml = currentTeacherReportRows.map((row, index) => `
      <tr>
        <td class="col-center">${index + 1}</td>
        <td>${formatDateHuman(row.date)}</td>
        <td class="col-center">${formatTime(row.first)}</td>
        <td class="col-center">${formatTime(row.last)}</td>
        <td class="col-center">${row.scans}</td>
      </tr>
    `).join('');

    teacherDayBody.innerHTML = `
      <table class="day-report-table">
        <thead>
          <tr>
            <th class="col-center">SL</th>
            <th>Date</th>
            <th class="col-center">In Time</th>
            <th class="col-center">Out Time</th>
            <th class="col-center">Total Scans</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;
  } catch (error) {
    console.error('Teacher day-wise report error:', error);
    teacherDayBody.innerHTML = `<div class="modal-empty">Error loading report: ${error.message || JSON.stringify(error)}</div>`;
  }
}

function printTeacherDayReport() {
  if (!currentTeacherIid) {
    alert('No teacher selected.');
    return;
  }

  const reportDate = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const bodyRows = currentTeacherReportRows.map((row, index) => (
    `<tr><td>${index + 1}</td><td>${formatDateHuman(row.date)}</td><td>${formatTime(row.first)}</td><td>${formatTime(row.last)}</td><td>${row.scans}</td></tr>`
  )).join('') || '<tr><td colspan="5" style="text-align:center;">No records found</td></tr>';

  const html = [
    '<!doctype html>',
    '<html>',
    '<head>',
    '  <meta charset="utf-8" />',
    '  <title>Teacher Day-wise Report</title>',
    '  <style>',
    '    body{font-family:Segoe UI,Arial,sans-serif;padding:20px;color:#111}',
    '    h2{margin:0 0 6px}',
    '    p{margin:0 0 10px}',
    '    table{width:100%;border-collapse:collapse;margin-top:12px}',
    '    th,td{border:1px solid #444;padding:8px 10px;font-size:12px}',
    '    th{background:#f1f5f9;text-transform:uppercase}',
    '    .meta{margin-bottom:8px;color:#334155}',
    '  </style>',
    '</head>',
    '<body>',
    '  <h2>FENI MODEL HIGH SCHOOL</h2>',
    '  <p><strong>Teacher Day-wise Attendance Report</strong></p>',
    `  <div class="meta">Teacher: ${currentTeacherName} | IID: ${currentTeacherIid} | Printed: ${reportDate}</div>`,
    '  <table>',
    '    <thead>',
    '      <tr><th>SL</th><th>Date</th><th>In Time</th><th>Out Time</th><th>Total Scans</th></tr>',
    '    </thead>',
    `    <tbody>${bodyRows}</tbody>`,
    '  </table>',
    '</body>',
    '</html>'
  ].join('\n');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-up to print teacher report.');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function preparePrint() {
  try {
    updatePrintValues();
    document.body.offsetHeight;
    window.print();
  } catch (error) {
    console.error('Error preparing print:', error);
    alert('Error preparing print. Please try again.');
  }
}

document.getElementById('refresh').addEventListener('click', loadEntries);
document.getElementById('printBtn').addEventListener('click', preparePrint);
document.getElementById('closeTeacherDayBtn').addEventListener('click', closeTeacherDayModal);
document.getElementById('printTeacherDayBtn').addEventListener('click', printTeacherDayReport);

tableBody.addEventListener('click', async (event) => {
  const target = event.target.closest('.teacher-link');
  if (!target) return;
  const iid = target.getAttribute('data-iid') || '';
  const name = target.getAttribute('data-name') || 'Teacher';
  await openTeacherDayReport(iid, name);
});

teacherDayModal.addEventListener('click', (event) => {
  if (event.target === teacherDayModal) {
    closeTeacherDayModal();
  }
});

dateFilter.addEventListener('change', () => {
  updatePageTitle();
  loadEntries();
});

window.addEventListener('beforeprint', () => {
  updatePrintValues();
});

window.preparePrint = preparePrint;

updatePageTitle();
loadEntries();