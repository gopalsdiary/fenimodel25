
// ============================================
// ===== EXPORT: PDF & CSV =====
// ============================================

function getFilteredHistory() {
  const history = loadFromStorage(STORAGE_KEYS.SCAN_HISTORY) || [];
  const filterEl = document.getElementById('historyKeyFilter');
  const currentFilter = filterEl ? filterEl.value : '__all__';
  if (currentFilter === '__all__') return { entries: history, keyName: 'সকল উত্তরপত্র' };
  const filtered = history.filter(e => (e.answerKeyId || '__none__') === currentFilter);
  const keyName = filterEl.options[filterEl.selectedIndex].text;
  return { entries: filtered, keyName };
}

function exportHistoryCSV() {
  const { entries, keyName } = getFilteredHistory();
  if (entries.length === 0) { showToast('কোনো ডাটা নেই!', 'error'); return; }

  // BOM for Excel UTF-8
  const BOM = '\uFEFF';
  const headers = ['Roll', 'Name', 'Score', 'Max', 'Percentage', 'Correct', 'Wrong', 'Blank', 'Exam', 'Class', 'Subject', 'Date'];

  const rows = entries.map(e => [
    e.rollNumber || '',
    '', // name not stored
    e.score,
    e.maxScore,
    e.percentage + '%',
    e.correct,
    e.wrong,
    e.blank,
    e.answerKeyName || e.examName || '',
    e.examClass || '',
    e.examSubject || '',
    new Date(e.timestamp).toLocaleString('en-GB')
  ]);

  // Detail rows per question
  const detailHeaders = ['Roll'];
  const numQ = entries[0].total || 30;
  for (let q = 1; q <= numQ; q++) detailHeaders.push('Q' + q);
  detailHeaders.push('Score', 'Percentage');

  const detailRows = entries.map(e => {
    const row = [e.rollNumber || ''];
    for (let q = 1; q <= numQ; q++) {
      const a = e.answers ? e.answers[q] : null;
      if (!a) { row.push(''); continue; }
      if (a.status === 'correct') row.push(a.detected + ' ✓');
      else if (a.status === 'wrong') row.push(a.detected + ' ✗');
      else row.push('-');
    }
    row.push(e.score, e.percentage + '%');
    return row;
  });

  const csvContent = BOM +
    '# Summary: ' + keyName + '\n' +
    headers.join(',') + '\n' +
    rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n') +
    '\n\n# Question Details\n' +
    detailHeaders.join(',') + '\n' +
    detailRows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'OMR_Results_' + keyName.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '_') + '.csv';
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV ডাউনলোড হচ্ছে...', 'success');
}

function exportHistoryPDF() {
  const { entries, keyName } = getFilteredHistory();
  if (entries.length === 0) { showToast('কোনো ডাটা নেই!', 'error'); return; }

  const numQ = entries[0].total || 30;
  const totalStudents = entries.length;
  const avgPct = (entries.reduce((s, e) => s + (e.percentage || 0), 0) / totalStudents).toFixed(1);

  // Build HTML table for the PDF
  let html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>OMR Results - ' + keyName + '</title>';
  html += '<style>';
  html += 'body{font-family:Arial,sans-serif;margin:20px;color:#222;}';
  html += 'h2{text-align:center;margin-bottom:4px;}';
  html += '.meta{text-align:center;color:#555;font-size:13px;margin-bottom:16px;}';
  html += '.summary{display:flex;justify-content:center;gap:24px;margin-bottom:16px;font-size:14px;}';
  html += '.summary b{color:#1565C0;}';
  html += 'table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:20px;}';
  html += 'th,td{border:1px solid #bbb;padding:4px 6px;text-align:center;}';
  html += 'th{background:#1565C0;color:#fff;font-size:10px;}';
  html += 'tr:nth-child(even){background:#f5f5f5;}';
  html += '.correct{color:#2E7D32;font-weight:bold;}';
  html += '.wrong{color:#C62828;}';
  html += '.blank{color:#999;}';
  html += '@media print{@page{size:A4 landscape;margin:10mm;}body{margin:0;}}';
  html += '</style></head><body>';

  // Header
  html += '<h2>📋 OMR ফলাফল — ' + keyName + '</h2>';
  const firstEntry = entries[0];
  html += '<div class="meta">';
  html += [firstEntry.examClass, firstEntry.examSubject, firstEntry.examSection].filter(Boolean).join(' | ');
  html += ' | তারিখ: ' + new Date().toLocaleDateString('bn-BD');
  html += '</div>';

  // Summary
  html += '<div class="summary">';
  html += '<span>👨‍🎓 মোট: <b>' + totalStudents + '</b></span>';
  html += '<span>📈 গড়: <b>' + avgPct + '%</b></span>';
  html += '<span>❓ প্রশ্ন: <b>' + numQ + '</b></span>';
  html += '</div>';

  // Summary table
  html += '<table><thead><tr><th>#</th><th>রোল</th><th>স্কোর</th><th>%</th><th>সঠিক</th><th>ভুল</th><th>খালি</th>';
  for (let q = 1; q <= numQ; q++) html += '<th>Q' + q + '</th>';
  html += '</tr></thead><tbody>';

  entries.forEach((e, idx) => {
    html += '<tr>';
    html += '<td>' + (idx + 1) + '</td>';
    html += '<td><b>' + (e.rollNumber || '—') + '</b></td>';
    html += '<td>' + e.score + '/' + e.maxScore + '</td>';
    html += '<td>' + e.percentage + '%</td>';
    html += '<td class="correct">' + e.correct + '</td>';
    html += '<td class="wrong">' + e.wrong + '</td>';
    html += '<td class="blank">' + e.blank + '</td>';
    for (let q = 1; q <= numQ; q++) {
      const a = e.answers ? e.answers[q] : null;
      if (!a) { html += '<td></td>'; continue; }
      if (a.status === 'correct') html += '<td class="correct">' + a.detected + '</td>';
      else if (a.status === 'wrong') html += '<td class="wrong">' + a.detected + '</td>';
      else html += '<td class="blank">—</td>';
    }
    html += '</tr>';
  });
  html += '</tbody></table>';

  // Footer
  html += '<p style="text-align:center;font-size:11px;color:#999;">Generated by OMR Scanner | ' + new Date().toLocaleString('bn-BD') + '</p>';
  html += '</body></html>';

  // Open in new window for print/share as PDF
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();

  // Auto-trigger print (Save as PDF)
  setTimeout(function() {
    win.print();
  }, 600);

  showToast('PDF তৈরি হচ্ছে... Print dialog থেকে "Save as PDF" চাপুন', 'success');
}

function clearFilteredHistory() {
  const filterEl = document.getElementById('historyKeyFilter');
  const currentFilter = filterEl ? filterEl.value : '__all__';
  if (currentFilter === '__all__') {
    clearHistory();