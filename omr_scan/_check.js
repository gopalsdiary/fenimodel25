
// ============================================
// ===== GLOBAL STATE =====
// ============================================
var cvReady = false;

const APP_STATE = {
  // Exam info
  examName: '',
  examClass: '',
  examSubject: '',
  examSection: '',
  examDate: '',
  numQuestions: 30,
  numOptions: 4,
  marksCorrect: 1,
  marksNegative: 0,
  
  // Answer key: { 1: 'A', 2: 'C', ... }
  answerKey: {},
  
  // Current scan result
  currentResult: null,
  
  // Camera
  stream: null,
  facingMode: 'environment',
  
  // Auto-scan
  autoScanTimer: null,
  autoScanBusy: false,
  autoScanCooldown: false,
  
  // Active saved key ID
  activeKeyId: null
};

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];

// ============================================
// ===== LOCAL STORAGE =====
// ============================================

const STORAGE_KEYS = {
  ANSWER_KEYS: 'omr_answer_keys',
  SCAN_HISTORY: 'omr_scan_history',
  LAST_SETUP: 'omr_last_setup'
};

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch(e) {
    console.error('Storage save error:', e);
  }
}

function loadFromStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch(e) {
    console.error('Storage load error:', e);
    return null;
  }
}

// ============================================
// ===== TAB MANAGEMENT =====
// ============================================

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.add('active');
}

// ============================================
// ===== SETUP TAB =====
// ============================================

function loadLastSetup() {
  const setup = loadFromStorage(STORAGE_KEYS.LAST_SETUP);
  if (setup) {
    document.getElementById('examName').value = setup.examName || '';
    document.getElementById('examClass').value = setup.examClass || '';
    document.getElementById('examSubject').value = setup.examSubject || '';
    document.getElementById('examSection').value = setup.examSection || '';
    document.getElementById('examDate').value = setup.examDate || '';
    document.getElementById('marksCorrect').value = setup.marksCorrect ?? 1;
    document.getElementById('marksNegative').value = setup.marksNegative ?? 0;
  }
  // Set today's date if empty
  if (!document.getElementById('examDate').value) {
    document.getElementById('examDate').value = new Date().toISOString().split('T')[0];
  }
}

function collectSetup() {
  APP_STATE.examName = document.getElementById('examName').value.trim();
  APP_STATE.examClass = document.getElementById('examClass').value;
  APP_STATE.examSubject = document.getElementById('examSubject').value.trim();
  APP_STATE.examSection = document.getElementById('examSection').value.trim();
  APP_STATE.examDate = document.getElementById('examDate').value;
  APP_STATE.numQuestions = 30;
  APP_STATE.numOptions = 4;
  APP_STATE.marksCorrect = parseFloat(document.getElementById('marksCorrect').value) || 1;
  APP_STATE.marksNegative = parseFloat(document.getElementById('marksNegative').value) || 0;
  
  // Save to storage
  saveToStorage(STORAGE_KEYS.LAST_SETUP, {
    examName: APP_STATE.examName,
    examClass: APP_STATE.examClass,
    examSubject: APP_STATE.examSubject,
    examSection: APP_STATE.examSection,
    examDate: APP_STATE.examDate,
    marksCorrect: APP_STATE.marksCorrect,
    marksNegative: APP_STATE.marksNegative
  });
}

function goToAnswerKey() {
  collectSetup();
  buildAnswerKeyGrid();
  switchTab('answerkey');
}

// ============================================
// ===== ANSWER KEY TAB =====
// ============================================

function buildAnswerKeyGrid() {
  const grid = document.getElementById('answerKeyGrid');
  const n = APP_STATE.numQuestions;
  const opts = APP_STATE.numOptions;
  
  grid.innerHTML = '';
  
  for (let q = 1; q <= n; q++) {
    const row = document.createElement('div');
    row.className = 'answer-row';
    const selected = APP_STATE.answerKey[q] || [];
    row.innerHTML = `
      <span class="answer-num">${q}</span>
      <div class="bubble-group" data-question="${q}">
        ${OPTION_LABELS.slice(0, opts).map(opt => `
          <div class="bubble ${selected.indexOf(opt) >= 0 ? 'selected' : ''}" 
               data-q="${q}" data-opt="${opt}" 
               onclick="selectAnswer(${q}, '${opt}')">
            ${opt}
          </div>
        `).join('')}
      </div>
    `;
    grid.appendChild(row);
  }
}

function selectAnswer(q, opt) {
  // Multi-select toggle: answerKey[q] is an array
  if (!APP_STATE.answerKey[q]) {
    APP_STATE.answerKey[q] = [];
  }
  const idx = APP_STATE.answerKey[q].indexOf(opt);
  if (idx >= 0) {
    APP_STATE.answerKey[q].splice(idx, 1);
    if (APP_STATE.answerKey[q].length === 0) {
      delete APP_STATE.answerKey[q];
    }
  } else {
    APP_STATE.answerKey[q].push(opt);
  }
  
  // Update UI
  const group = document.querySelector(`.bubble-group[data-question="${q}"]`);
  if (group) {
    const selected = APP_STATE.answerKey[q] || [];
    group.querySelectorAll('.bubble').forEach(b => {
      b.classList.toggle('selected', selected.indexOf(b.dataset.opt) >= 0);
    });
  }
}

function quickFillAll(opt) {
  for (let q = 1; q <= APP_STATE.numQuestions; q++) {
    APP_STATE.answerKey[q] = opt;
  }
  buildAnswerKeyGrid();
  showToast(`সব উত্তর ${opt} সেট করা হয়েছে`);
}

function quickFillRandom() {
  const opts = OPTION_LABELS.slice(0, APP_STATE.numOptions);
  for (let q = 1; q <= APP_STATE.numQuestions; q++) {
    APP_STATE.answerKey[q] = opts[Math.floor(Math.random() * opts.length)];
  }
  buildAnswerKeyGrid();
  showToast('র‍্যান্ডম উত্তর সেট করা হয়েছে');
}

function clearAllAnswers() {
  APP_STATE.answerKey = {};
  buildAnswerKeyGrid();
  showToast('সব উত্তর মুছে ফেলা হয়েছে');
}

function saveAnswerKey() {
  collectSetup();
  
  // Validate
  const answered = Object.keys(APP_STATE.answerKey).length;
  if (answered === 0) {
    showToast('অন্তত একটি উত্তর নির্বাচন করুন!', 'error');
    return;
  }
  
  const keys = loadFromStorage(STORAGE_KEYS.ANSWER_KEYS) || [];
  
  const keyData = {
    id: APP_STATE.activeKeyId || Date.now().toString(),
    examName: APP_STATE.examName || 'নামহীন পরীক্ষা',
    examClass: APP_STATE.examClass,
    examSubject: APP_STATE.examSubject,
    examSection: APP_STATE.examSection,
    examDate: APP_STATE.examDate,
    numQuestions: APP_STATE.numQuestions,
    numOptions: APP_STATE.numOptions,
    marksCorrect: APP_STATE.marksCorrect,
    marksNegative: APP_STATE.marksNegative,
    answerKey: {...APP_STATE.answerKey},
    savedAt: new Date().toISOString()
  };
  
  // Update if exists, else add
  const existingIdx = keys.findIndex(k => k.id === keyData.id);
  if (existingIdx >= 0) {
    keys[existingIdx] = keyData;
  } else {
    keys.unshift(keyData);
  }
  
  saveToStorage(STORAGE_KEYS.ANSWER_KEYS, keys);
  APP_STATE.activeKeyId = keyData.id;
  
  renderSavedKeys();
  showToast(`উত্তরপত্র সংরক্ষিত (${answered}/${APP_STATE.numQuestions} উত্তর)`, 'success');
}

function renderSavedKeys() {
  const keys = loadFromStorage(STORAGE_KEYS.ANSWER_KEYS) || [];
  const container = document.getElementById('savedKeysList');
  
  if (keys.length === 0) {
    container.innerHTML = '<p style="color:var(--text-sec);text-align:center;padding:20px;">কোনো সংরক্ষিত উত্তরপত্র নেই</p>';
    return;
  }
  
  container.innerHTML = keys.map(k => `
    <div class="saved-key-item" style="${APP_STATE.activeKeyId === k.id ? 'border:2px solid var(--primary);' : ''}">
      <div class="saved-key-info">
        <h4>${k.examName || 'নামহীন'}</h4>
        <p>${k.examClass || ''} ${k.examSubject || ''} | ${k.numQuestions} প্রশ্ন | ${Object.keys(k.answerKey).length} উত্তর</p>
        <p>${new Date(k.savedAt).toLocaleDateString('bn-BD')}</p>
      </div>
      <div class="saved-key-actions">
        <button class="btn btn-sm btn-primary" onclick="loadAnswerKey('${k.id}')">📂</button>
        <button class="btn btn-sm btn-danger" onclick="deleteAnswerKey('${k.id}')">🗑️</button>
      </div>
    </div>
  `).join('');
}

function loadAnswerKey(id) {
  const keys = loadFromStorage(STORAGE_KEYS.ANSWER_KEYS) || [];
  const key = keys.find(k => k.id === id);
  if (!key) return;
  
  APP_STATE.activeKeyId = key.id;
  APP_STATE.examName = key.examName;
  APP_STATE.examClass = key.examClass;
  APP_STATE.examSubject = key.examSubject;
  APP_STATE.examSection = key.examSection || '';
  APP_STATE.examDate = key.examDate;
  APP_STATE.numQuestions = 30;
  APP_STATE.numOptions = 4;
  APP_STATE.marksCorrect = key.marksCorrect ?? 1;
  APP_STATE.marksNegative = key.marksNegative ?? 0;
  APP_STATE.answerKey = {...key.answerKey};
  
  // Migrate old format: string values -> array values
  for (const q in APP_STATE.answerKey) {
    if (typeof APP_STATE.answerKey[q] === 'string') {
      APP_STATE.answerKey[q] = [APP_STATE.answerKey[q]];
    }
  }
  
  // Update form
  document.getElementById('examName').value = key.examName || '';
  document.getElementById('examClass').value = key.examClass || '';
  document.getElementById('examSubject').value = key.examSubject || '';
  document.getElementById('examSection').value = key.examSection || '';
  document.getElementById('examDate').value = key.examDate || '';
  document.getElementById('marksCorrect').value = key.marksCorrect ?? 1;
  document.getElementById('marksNegative').value = key.marksNegative ?? 0;
  
  buildAnswerKeyGrid();
  renderSavedKeys();
  switchTab('answerkey');
  showToast('উত্তরপত্র লোড করা হয়েছে', 'success');
}

function deleteAnswerKey(id) {
  if (!confirm('এই উত্তরপত্র মুছে ফেলবেন?')) return;
  let keys = loadFromStorage(STORAGE_KEYS.ANSWER_KEYS) || [];
  keys = keys.filter(k => k.id !== id);
  saveToStorage(STORAGE_KEYS.ANSWER_KEYS, keys);
  if (APP_STATE.activeKeyId === id) APP_STATE.activeKeyId = null;
  renderSavedKeys();
  showToast('উত্তরপত্র মুছে ফেলা হয়েছে');
}

function goToScan() {
  collectSetup();
  const answered = Object.keys(APP_STATE.answerKey).length;
  if (answered === 0) {
    showToast('প্রথমে উত্তরপত্র তৈরি করুন!', 'error');
    return;
  }
  switchTab('scan');
}

// ============================================
// ===== CAMERA MANAGEMENT =====
// ============================================

async function startCamera() {
  try {
    if (APP_STATE.stream) {
      stopCamera();
    }
    
    const constraints = {
      video: {
        facingMode: APP_STATE.facingMode,
        width: { ideal: 1280 },
        height: { ideal: 1920 },
        focusMode: 'continuous'
      }
    };
    
    APP_STATE.stream = await navigator.mediaDevices.getUserMedia(constraints);
    const video = document.getElementById('cameraVideo');
    video.srcObject = APP_STATE.stream;
    
    document.getElementById('cameraSection').style.display = 'block';
    document.getElementById('uploadSection').style.display = 'none';
    updateScanStatus('📡 অটো-স্ক্যান চলছে... OMR শীট ক্যামেরার সামনে ধরুন।', 'info');
    
    // Start auto-scan loop
    startAutoScan();
    
  } catch(err) {
    console.error('Camera error:', err);
    showToast('ক্যামেরা অ্যাক্সেস করা যায়নি: ' + err.message, 'error');
    updateScanStatus('ক্যামেরা অ্যাক্সেস করা যায়নি। ছবি আপলোড করুন।', 'error');
  }
}

function stopCamera() {
  stopAutoScan();
  if (APP_STATE.stream) {
    APP_STATE.stream.getTracks().forEach(t => t.stop());
    APP_STATE.stream = null;
  }
  document.getElementById('cameraVideo').srcObject = null;
  document.getElementById('cameraSection').style.display = 'none';
  document.getElementById('uploadSection').style.display = 'block';
}

function switchCamera() {
  APP_STATE.facingMode = APP_STATE.facingMode === 'environment' ? 'user' : 'environment';
  startCamera();
}

function captureFrame() {
  const video = document.getElementById('cameraVideo');
  if (!video.srcObject) return;
  
  const canvas = document.getElementById('processingCanvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  
  showImagePreview(canvas);
  stopAutoScan();
  updateScanStatus('ছবি ক্যাপচার করা হয়েছে। বিশ্লেষণ করতে বোতাম চাপুন।', 'success');
}

// ============================================
// ===== AUTO-SCAN (Live OMR Detection) =====
// ============================================

function startAutoScan() {
  if (APP_STATE.autoScanTimer) return;
  APP_STATE.autoScanBusy = false;
  APP_STATE.autoScanCooldown = false;
  
  const indicator = document.getElementById('autoScanIndicator');
  if (indicator) indicator.style.display = 'block';
  
  // Scan every 800ms
  APP_STATE.autoScanTimer = setInterval(autoScanFrame, 800);
  console.log('Auto-scan started');
}

function stopAutoScan() {
  if (APP_STATE.autoScanTimer) {
    clearInterval(APP_STATE.autoScanTimer);
    APP_STATE.autoScanTimer = null;
  }
  APP_STATE.autoScanBusy = false;
  APP_STATE.autoScanCooldown = false;
  
  const indicator = document.getElementById('autoScanIndicator');
  if (indicator) indicator.style.display = 'none';
  
  console.log('Auto-scan stopped');
}

async function autoScanFrame() {
  // Guards
  if (APP_STATE.autoScanBusy || APP_STATE.autoScanCooldown) return;
  if (!cvReady) return;
  if (!APP_STATE.stream) return;
  
  const answered = Object.keys(APP_STATE.answerKey).length;
  if (answered === 0) return; // need answer key first
  
  const video = document.getElementById('cameraVideo');
  if (!video || !video.videoWidth) return;
  
  APP_STATE.autoScanBusy = true;
  
  try {
    // Capture current frame to a temp canvas
    const tmpCanvas = document.createElement('canvas');
    const maxDim = 800; // lower res for speed
    let vw = video.videoWidth, vh = video.videoHeight;
    const scale = Math.min(1, maxDim / Math.max(vw, vh));
    tmpCanvas.width = Math.round(vw * scale);
    tmpCanvas.height = Math.round(vh * scale);
    tmpCanvas.getContext('2d').drawImage(video, 0, 0, tmpCanvas.width, tmpCanvas.height);
    
    const src = cv.imread(tmpCanvas);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    const blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    const edges = new cv.Mat();
    cv.Canny(blurred, edges, 50, 150);
    
    const sheetContour = findOMRSheet(edges, src);
    
    src.delete(); gray.delete(); blurred.delete(); edges.delete();
    
    if (sheetContour) {
      sheetContour.delete();
      console.log('Auto-scan: OMR sheet detected! Processing...');
      
      updateScanStatus('✅ OMR শীট পাওয়া গেছে! স্ক্যান করা হচ্ছে...', 'success');
      
      // Stop auto-scan and do full processing from high-res frame
      stopAutoScan();
      
      // Capture full-res frame
      const fullCanvas = document.getElementById('processingCanvas');
      fullCanvas.width = video.videoWidth;
      fullCanvas.height = video.videoHeight;
      fullCanvas.getContext('2d').drawImage(video, 0, 0);
      showImagePreview(fullCanvas);
      
      // Process it
      await processUploadedImage();
      return;
    }
    
  } catch (e) {
    console.warn('Auto-scan frame error:', e);
  } finally {
    APP_STATE.autoScanBusy = false;
  }
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.getElementById('processingCanvas');
      // Limit size for performance
      const maxDim = 1500;
      let w = img.width, h = img.height;
      if (Math.max(w, h) > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      
      showImagePreview(canvas);
      updateScanStatus('ছবি আপলোড হয়েছে। বিশ্লেষণ করতে বোতাম চাপুন।', 'success');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  
  // Reset file input
  event.target.value = '';
}

function showImagePreview(srcCanvas) {
  const previewCanvas = document.getElementById('previewCanvas');
  previewCanvas.width = srcCanvas.width;
  previewCanvas.height = srcCanvas.height;
  previewCanvas.getContext('2d').drawImage(srcCanvas, 0, 0);
  
  document.getElementById('imagePreviewSection').style.display = 'block';
}

function updateScanStatus(msg, type) {
  const el = document.getElementById('scanStatus');
  el.textContent = msg;
  el.className = 'status-bar ' + (type || 'info');
}

// ============================================
// ===== OMR IMAGE PROCESSING (OpenCV.js) =====
// ============================================

async function processUploadedImage() {
  if (!cvReady) {
    showToast('OpenCV.js এখনো লোড হচ্ছে, অপেক্ষা করুন...', 'error');
    return;
  }
  
  const answered = Object.keys(APP_STATE.answerKey).length;
  if (answered === 0) {
    showToast('প্রথমে উত্তরপত্র তৈরি করুন!', 'error');
    return;
  }
  
  showProcessing(true, 'OMR শীট বিশ্লেষণ করা হচ্ছে...');
  
  // Give UI time to update
  await sleep(100);
  
  try {
    const canvas = document.getElementById('processingCanvas');
    const src = cv.imread(canvas);
    
    // Step 1: Grayscale
    showProcessing(true, 'গ্রেস্কেল রূপান্তর...');
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    showDebugImage('debugGray', gray);
    
    // Step 2+: Extract best sheet candidate
    showProcessing(true, 'OMR শীট অঞ্চল নির্বাচন করা হচ্ছে...');
    const bestSheet = extractBestSheetCandidate(src, gray);
    const workingImage = bestSheet.workingImage;
    const warpThresh = bestSheet.warpThresh;

    showDebugImage('debugEdge', bestSheet.debugEdge);
    showDebugImage('debugWarp', workingImage);
    showDebugImage('debugThresh', warpThresh);

    // Step 8: Detect bubbles and read answers
    showProcessing(true, 'বাবল সনাক্ত করা হচ্ছে...');
    const detectedAnswers = bestSheet.detectedAnswers;
    
    // Step 8b: Detect roll number from bubbles
    showProcessing(true, 'রোল নম্বর পড়া হচ্ছে...');
    const detectedRoll = bestSheet.detectedRoll;
    
    // Step 9: Grade
    showProcessing(true, 'গ্রেডিং করা হচ্ছে...');
    const result = gradeAnswers(detectedAnswers);
    result.rollNumber = detectedRoll;
    
    APP_STATE.currentResult = result;
    displayResults(result);
    
    // Show debug
    document.getElementById('debugSection').classList.add('show');
    
    // Cleanup
    src.delete(); gray.delete();
    if (bestSheet.debugEdge) bestSheet.debugEdge.delete();
    warpThresh.delete(); workingImage.delete();
    
    showProcessing(false);
    
    // Auto-save and continue scanning
    autoSaveAndContinue(result);
    
  } catch(err) {
    console.error('Processing error:', err);
    showProcessing(false);
    
    // Fallback: Try simplified detection
    showToast('উন্নত সনাক্তকরণ ব্যর্থ। সরল পদ্ধতি ব্যবহার করা হচ্ছে...', 'warning');
    await sleep(500);
    processSimplified();
  }
}

function extractSheetFromRegion(regionGray, regionColor) {
  const blurred = new cv.Mat();
  cv.GaussianBlur(regionGray, blurred, new cv.Size(5, 5), 0);

  const edges = new cv.Mat();
  cv.Canny(blurred, edges, 50, 150);

  const contour = findOMRSheet(edges, regionColor);
  let workingImage;
  let contourFound = false;

  if (contour) {
    contourFound = true;
    workingImage = perspectiveTransform(regionGray, contour);
    contour.delete();
  } else {
    workingImage = regionGray.clone();
  }

  workingImage = correctOrientation(workingImage);

  return { workingImage, contourFound, edges, blurred };
}

function extractBestSheetCandidate(src, gray) {
  const candidates = [
    {
      name: 'full',
      gray: gray,
      color: src,
      cleanup: null
    }
  ];

  // A4 landscape dual print support: evaluate left/right halves separately
  const isLandscape = src.cols > src.rows * 1.2;
  if (isLandscape) {
    const midX = Math.floor(src.cols / 2);
    const overlap = Math.max(10, Math.round(src.cols * 0.02));

    const leftRect = new cv.Rect(0, 0, Math.min(src.cols, midX + overlap), src.rows);
    const rightX = Math.max(0, midX - overlap);
    const rightRect = new cv.Rect(rightX, 0, src.cols - rightX, src.rows);

    const grayLeft = gray.roi(leftRect);
    const srcLeft = src.roi(leftRect);
    const grayRight = gray.roi(rightRect);
    const srcRight = src.roi(rightRect);

    candidates.push({
      name: 'left-half',
      gray: grayLeft,
      color: srcLeft,
      cleanup: () => { grayLeft.delete(); srcLeft.delete(); }
    });
    candidates.push({
      name: 'right-half',
      gray: grayRight,
      color: srcRight,
      cleanup: () => { grayRight.delete(); srcRight.delete(); }
    });
  }

  let best = null;

  for (const c of candidates) {
    const extracted = extractSheetFromRegion(c.gray, c.color);
    const warpThresh = new cv.Mat();
    cv.adaptiveThreshold(extracted.workingImage, warpThresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 15, 4);

    const detectedAnswers = detectBubbles(warpThresh, extracted.workingImage);
    const detectedRoll = detectRollNumber(warpThresh, extracted.workingImage);

    const answerCount = Object.keys(detectedAnswers).length;
    const rollBonus = detectedRoll ? 4 : 0;
    const contourBonus = extracted.contourFound ? 2 : 0;
    const score = answerCount + rollBonus + contourBonus;

    if (!best || score > best.score) {
      if (best) {
        best.warpThresh.delete();
        best.workingImage.delete();
        if (best.debugEdge) best.debugEdge.delete();
      }
      best = {
        name: c.name,
        score,
        answerCount,
        workingImage: extracted.workingImage,
        warpThresh,
        detectedAnswers,
        detectedRoll,
        debugEdge: extracted.edges
      };
    } else {
      warpThresh.delete();
      extracted.workingImage.delete();
      extracted.edges.delete();
    }

    extracted.blurred.delete();
    if (c.cleanup) c.cleanup();
  }

  if (!best) {
    // Defensive fallback
    const fallbackWorking = correctOrientation(gray.clone());
    const fallbackThresh = new cv.Mat();
    cv.adaptiveThreshold(fallbackWorking, fallbackThresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 15, 4);
    best = {
      name: 'fallback',
      score: 0,
      answerCount: 0,
      workingImage: fallbackWorking,
      warpThresh: fallbackThresh,
      detectedAnswers: detectBubbles(fallbackThresh, fallbackWorking),
      detectedRoll: detectRollNumber(fallbackThresh, fallbackWorking),
      debugEdge: null
    };
  }

  console.log('Selected sheet candidate:', best.name, '| score:', best.score, '| answers:', best.answerCount, '| roll:', best.detectedRoll || 'N/A');
  return best;
}

function findOMRSheet(edges, src) {
  // Dilate edges to connect nearby edges
  const dilated = new cv.Mat();
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
  cv.dilate(edges, dilated, kernel, new cv.Point(-1, -1), 2);
  
  // Find contours
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(dilated, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  
  // Find the largest 4-sided contour
  let maxArea = 0;
  let bestContour = null;
  
  const imgArea = src.rows * src.cols;
  
  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i);
    const area = cv.contourArea(cnt);
    
    // Must be at least 20% of image area
    if (area < imgArea * 0.2) continue;
    
    const peri = cv.arcLength(cnt, true);
    const approx = new cv.Mat();
    cv.approxPolyDP(cnt, approx, 0.02 * peri, true);
    
    if (approx.rows === 4 && area > maxArea) {
      maxArea = area;
      if (bestContour) bestContour.delete();
      bestContour = approx.clone();
    }
    approx.delete();
  }
  
  // Also try to find fiducial markers (black squares at corners)
  if (!bestContour) {
    bestContour = findFiducialMarkers(src);
  }
  
  dilated.delete(); kernel.delete(); contours.delete(); hierarchy.delete();
  
  return bestContour;
}

function findFiducialMarkers(src) {
  // Convert to grayscale if needed
  let gray;
  if (src.channels() > 1) {
    gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  } else {
    gray = src.clone();
  }
  
  // Threshold to find dark regions
  const binary = new cv.Mat();
  cv.threshold(gray, binary, 60, 255, cv.THRESH_BINARY_INV);
  
  // Find contours
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  
  // Look for square-ish contours that could be fiducial markers
  const markers = [];
  const imgArea = src.rows * src.cols;
  
  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i);
    const area = cv.contourArea(cnt);
    
    // Markers are small squares — 0.05% to 3% of image area
    if (area < imgArea * 0.0005 || area > imgArea * 0.03) continue;
    
    const rect = cv.boundingRect(cnt);
    const aspectRatio = rect.width / rect.height;
    const extent = area / (rect.width * rect.height);
    
    // Must be roughly square and filled
    if (aspectRatio > 0.5 && aspectRatio < 2.0 && extent > 0.6) {
      markers.push({
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
        w: rect.width,
        h: rect.height,
        area: area
      });
    }
  }
  
  gray.delete(); binary.delete(); contours.delete(); hierarchy.delete();
  
  // We need at least 3 markers (BR is intentionally missing)
  if (markers.length < 3) return null;
  
  // Sort by area descending and take top markers
  markers.sort((a, b) => b.area - a.area);
  const topMarkers = markers.slice(0, Math.min(markers.length, 8));
  
  // Find the 4 corner markers
  const corners = findCornerMarkers(topMarkers, src.cols, src.rows);
  if (!corners) return null;
  
  // Create contour from corners
  const contour = cv.matFromArray(4, 1, cv.CV_32SC2, [
    corners.tl.x, corners.tl.y,
    corners.tr.x, corners.tr.y,
    corners.br.x, corners.br.y,
    corners.bl.x, corners.bl.y
  ]);
  
  return contour;
}

function findCornerMarkers(markers, imgW, imgH) {
  if (markers.length < 3) return null;
  
  const cx = imgW / 2, cy = imgH / 2;
  
  let tl = null, tr = null, bl = null;
  let tlDist = Infinity, trDist = Infinity, blDist = Infinity;
  
  for (const m of markers) {
    const dTL = Math.hypot(m.x, m.y);
    const dTR = Math.hypot(imgW - m.x, m.y);
    const dBL = Math.hypot(m.x, imgH - m.y);
    
    if (m.x < cx && m.y < cy && dTL < tlDist) { tl = m; tlDist = dTL; }
    if (m.x > cx && m.y < cy && dTR < trDist) { tr = m; trDist = dTR; }
    if (m.x < cx && m.y > cy && dBL < blDist) { bl = m; blDist = dBL; }
  }
  
  if (!tl || !tr || !bl) return null;
  
  // BR is the missing corner — compute via parallelogram rule: BR = TR + BL - TL
  const br = { x: tr.x + bl.x - tl.x, y: tr.y + bl.y - tl.y, w: tl.w, h: tl.h, area: tl.area };
  
  return { tl, tr, bl, br };
}

function perspectiveTransform(grayImg, contour) {
  // Order points: TL, TR, BR, BL
  const points = [];
  for (let i = 0; i < 4; i++) {
    points.push({
      x: contour.data32S[i * 2],
      y: contour.data32S[i * 2 + 1]
    });
  }
  
  const ordered = orderPoints(points);
  
  // Calculate output dimensions
  const widthA = Math.hypot(ordered[2].x - ordered[3].x, ordered[2].y - ordered[3].y);
  const widthB = Math.hypot(ordered[1].x - ordered[0].x, ordered[1].y - ordered[0].y);
  const maxWidth = Math.round(Math.max(widthA, widthB));
  
  const heightA = Math.hypot(ordered[1].x - ordered[2].x, ordered[1].y - ordered[2].y);
  const heightB = Math.hypot(ordered[0].x - ordered[3].x, ordered[0].y - ordered[3].y);
  const maxHeight = Math.round(Math.max(heightA, heightB));
  
  const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
    ordered[0].x, ordered[0].y,
    ordered[1].x, ordered[1].y,
    ordered[2].x, ordered[2].y,
    ordered[3].x, ordered[3].y
  ]);
  
  const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0,
    maxWidth - 1, 0,
    maxWidth - 1, maxHeight - 1,
    0, maxHeight - 1
  ]);
  
  const M = cv.getPerspectiveTransform(srcPts, dstPts);
  const warped = new cv.Mat();
  cv.warpPerspective(grayImg, warped, M, new cv.Size(maxWidth, maxHeight));
  
  srcPts.delete(); dstPts.delete(); M.delete();
  
  return warped;
}

function orderPoints(pts) {
  // Sort by sum (x+y): TL has smallest, BR has largest
  // Sort by diff (y-x): TR has smallest, BL has largest
  const sorted = [...pts];
  
  const sums = sorted.map(p => p.x + p.y);
  const diffs = sorted.map(p => p.y - p.x);
  
  const tl = sorted[sums.indexOf(Math.min(...sums))];
  const br = sorted[sums.indexOf(Math.max(...sums))];
  const tr = sorted[diffs.indexOf(Math.min(...diffs))];
  const bl = sorted[diffs.indexOf(Math.max(...diffs))];
  
  return [tl, tr, br, bl];
}

// ============================================
// ===== ORIENTATION CORRECTION =====
// ============================================

function correctOrientation(warpedGray) {
  // The OMR sheet has an asymmetric orientation marker at the top-left corner:
  //   - Black square + triangle + vertical bar = more black pixels than other corners
  // We measure black-pixel density in each of the 4 corner regions.
  // The corner with the highest density is where the orientation marker is → that should be top-left.
  
  const h = warpedGray.rows;
  const w = warpedGray.cols;
  
  // Size of corner region to examine (~8% of each dimension)
  const rh = Math.round(h * 0.08);
  const rw = Math.round(w * 0.08);
  
  // Threshold to binary
  const bin = new cv.Mat();
  cv.threshold(warpedGray, bin, 80, 255, cv.THRESH_BINARY_INV); // dark pixels → 255
  
  function cornerBlackRatio(startRow, startCol) {
    const roi = bin.roi(new cv.Rect(startCol, startRow, rw, rh));
    const total = rw * rh;
    const black = cv.countNonZero(roi);
    roi.delete();
    return black / total;
  }
  
  const tlRatio = cornerBlackRatio(0, 0);
  const trRatio = cornerBlackRatio(0, w - rw);
  const blRatio = cornerBlackRatio(h - rh, 0);
  const brRatio = cornerBlackRatio(h - rh, w - rw);
  
  console.log('Corner black ratios — TL:', tlRatio.toFixed(3), 'TR:', trRatio.toFixed(3), 'BL:', blRatio.toFixed(3), 'BR:', brRatio.toFixed(3));
  
  // 3-corner system: TL, TR, BL have markers; BR is EMPTY.
  // Find the corner with LEAST black = the missing corner (should be BR when correct).
  //   BR missing → 0° (correct)
  //   BL missing → sheet rotated 90° CW  → need 1× CCW
  //   TL missing → sheet rotated 180°    → need 2× CCW
  //   TR missing → sheet rotated 90° CCW → need 3× CCW
  const ratios = [
    { corner: 'TL', val: tlRatio, rotate: 2 },
    { corner: 'TR', val: trRatio, rotate: 3 },
    { corner: 'BR', val: brRatio, rotate: 0 },
    { corner: 'BL', val: blRatio, rotate: 1 }
  ];

  ratios.sort((a, b) => a.val - b.val); // LEAST black = empty corner
  const best = ratios[0];

  bin.delete();

  if (best.rotate === 0) {
    console.log('Orientation: correct (BR empty as expected)');
    return warpedGray;
  }

  console.log('Orientation: empty corner at ' + best.corner + ', rotating ' + (best.rotate * 90) + '° CCW');
  
  let result = warpedGray;
  for (let r = 0; r < best.rotate; r++) {
    const rotated = new cv.Mat();
    // cv.ROTATE_90_COUNTERCLOCKWISE rotates 90° CCW each time
    cv.rotate(result, rotated, cv.ROTATE_90_COUNTERCLOCKWISE);
    if (result !== warpedGray) result.delete();
    result = rotated;
  }
  
  warpedGray.delete();
  return result;
}

// ============================================
// ===== SHEET COORDINATE REFERENCE =====
// ============================================
// Exact pixel positions from drawOMRSheet (canvas 1240×1754)
const SHEET_COORDS = {
  W: 1240, H: 1754,
  // Fiducial marker centers (markerInset=50, markerSize=34 → center offset = 50+17 = 67)
  TL: { x: 67, y: 67 },
  TR: { x: 1173, y: 67 },   // 1240-50-34+17
  BL: { x: 67, y: 1687 },   // 1754-50-34+17
  // Roll bubble absolute centers
  // rollGridX=294, rollBubbleR=18, rollDigitGap=72
  rollDigits: [
    { cx: 312 },  // D1: 294+18
    { cx: 384 },  // D2: 294+72+18
    { cx: 456 }   // D3: 294+144+18
  ],
  rollRow0cy: 210,   // rollGridY(176)+16+rollBubbleR(18)
  rollRowStep: 38,   // rollRowH
  rollBubbleR: 18,
  // Answer bubble absolute centers
  // Cols xBase: 80,430,780; cx = xBase+65+opt*66; bubbleRadius=20
  answerCols: [
    { startQ: 1,  xCenters: [145, 211, 277, 343] },
    { startQ: 11, xCenters: [495, 561, 627, 693] },
    { startQ: 21, xCenters: [845, 911, 977, 1043] }
  ],
  ansRow0cy: 684,    // bubbleStartY(664)+bubbleRadius(20)
  ansRowStep: 96,    // rowHeight
  ansBubbleR: 20
};

// ============================================
// ===== MARKER-BASED COORDINATE MAPPER =====
// ============================================

function findMarkersInWarped(grayImg) {
  // Detect the 3 fiducial markers (TL, TR, BL) in the warped grayscale image
  const h = grayImg.rows;
  const w = grayImg.cols;

  const bin = new cv.Mat();
  cv.threshold(grayImg, bin, 80, 255, cv.THRESH_BINARY_INV);

  // Close small gaps
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
  const closed = new cv.Mat();
  cv.morphologyEx(bin, closed, cv.MORPH_CLOSE, kernel);

  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(closed, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  const markers = [];
  const imgArea = h * w;

  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i);
    const area = cv.contourArea(cnt);
    // Markers: 0.02% – 2% of image area
    if (area < imgArea * 0.0002 || area > imgArea * 0.02) continue;
    const rect = cv.boundingRect(cnt);
    const aspect = rect.width / rect.height;
    const extent = area / (rect.width * rect.height);
    if (aspect > 0.4 && aspect < 2.5 && extent > 0.5) {
      markers.push({
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
        w: rect.width, h: rect.height, area
      });
    }
  }

  bin.delete(); kernel.delete(); closed.delete();
  contours.delete(); hierarchy.delete();

  if (markers.length < 3) {
    console.warn('findMarkersInWarped: only found', markers.length, 'candidates');
    return null;
  }

  markers.sort((a, b) => b.area - a.area);
  const cands = markers.slice(0, Math.min(12, markers.length));
  const cx = w / 2, cy = h / 2;
  let tl = null, tr = null, bl = null;
  let tlD = Infinity, trD = Infinity, blD = Infinity;

  for (const m of cands) {
    const dTL = Math.hypot(m.x, m.y);
    const dTR = Math.hypot(w - m.x, m.y);
    const dBL = Math.hypot(m.x, h - m.y);
    if (m.x < cx && m.y < cy && dTL < tlD) { tl = m; tlD = dTL; }
    if (m.x > cx && m.y < cy && dTR < trD) { tr = m; trD = dTR; }
    if (m.x < cx && m.y > cy && dBL < blD) { bl = m; blD = dBL; }
  }

  if (!tl || !tr || !bl) {
    console.warn('findMarkersInWarped: could not identify TL/TR/BL corners');
    return null;
  }

  console.log('Warped markers — TL:(' + tl.x.toFixed(0) + ',' + tl.y.toFixed(0) +
    ') TR:(' + tr.x.toFixed(0) + ',' + tr.y.toFixed(0) +
    ') BL:(' + bl.x.toFixed(0) + ',' + bl.y.toFixed(0) + ')');
  return { tl, tr, bl };
}

function createSheetMapper(markers, imgW, imgH) {
  // Returns a function that maps sheet-pixel coordinates → warped-image coordinates
  const R = SHEET_COORDS;
  if (markers) {
    const scaleX = (markers.tr.x - markers.tl.x) / (R.TR.x - R.TL.x);
    const scaleY = (markers.bl.y - markers.tl.y) / (R.BL.y - R.TL.y);
    const offX = markers.tl.x - R.TL.x * scaleX;
    const offY = markers.tl.y - R.TL.y * scaleY;
    console.log('Mapper (marker): sX=' + scaleX.toFixed(4) + ' sY=' + scaleY.toFixed(4) +
      ' oX=' + offX.toFixed(1) + ' oY=' + offY.toFixed(1));
    const fn = (sx, sy) => ({ x: offX + sx * scaleX, y: offY + sy * scaleY });
    fn.scaleX = scaleX; fn.scaleY = scaleY;
    return fn;
  }
  // Fallback: assume warped covers the full 1240×1754 sheet
  const scaleX = imgW / R.W;
  const scaleY = imgH / R.H;
  console.log('Mapper (fallback): sX=' + scaleX.toFixed(4) + ' sY=' + scaleY.toFixed(4));
  const fn = (sx, sy) => ({ x: sx * scaleX, y: sy * scaleY });
  fn.scaleX = scaleX; fn.scaleY = scaleY;
  return fn;
}

// ============================================
// ===== BUBBLE DETECTION =====
// ============================================

function detectBubbles(threshImg, grayImg) {
  const h = threshImg.rows;
  const w = threshImg.cols;
  const numQ = APP_STATE.numQuestions;
  const numOpts = APP_STATE.numOptions;
  const detected = {};
  const R = SHEET_COORDS;

  // Find markers in warped image and build coordinate mapper
  const markers = findMarkersInWarped(grayImg);
  const mapper = createSheetMapper(markers, w, h);

  // Sample radius = ~75% of bubble radius, scaled to image
  const sampleR = Math.max(4, Math.round(R.ansBubbleR * mapper.scaleX * 0.75));

  for (let ci = 0; ci < R.answerCols.length; ci++) {
    const col = R.answerCols[ci];
    for (let row = 0; row < 10; row++) {
      const q = col.startQ + row;
      if (q > numQ) break;

      const sheetY = R.ansRow0cy + row * R.ansRowStep;

      let maxFill = 0;
      let bestOpt = null;
      const fillRatios = {};

      for (let opt = 0; opt < numOpts; opt++) {
        const pos = mapper(col.xCenters[opt], sheetY);
        const cx = Math.round(pos.x);
        const cy = Math.round(pos.y);
        const r = sampleR;
        const x1 = Math.max(0, cx - r);
        const y1 = Math.max(0, cy - r);
        const x2 = Math.min(w - 1, cx + r);
        const y2 = Math.min(h - 1, cy + r);
        if (x2 <= x1 || y2 <= y1) continue;

        const roi = threshImg.roi(new cv.Rect(x1, y1, x2 - x1, y2 - y1));
        const nonZero = cv.countNonZero(roi);
        const totalPixels = roi.rows * roi.cols;
        const fillRatio = totalPixels > 0 ? nonZero / totalPixels : 0;
        roi.delete();

        fillRatios[OPTION_LABELS[opt]] = fillRatio;
        if (fillRatio > maxFill) { maxFill = fillRatio; bestOpt = OPTION_LABELS[opt]; }
      }

      const FILL_THRESHOLD = 0.25;
      const RELATIVE_THRESHOLD = 1.5;

      if (maxFill > FILL_THRESHOLD && bestOpt) {
        const otherAvg = Object.entries(fillRatios)
          .filter(([k]) => k !== bestOpt)
          .reduce((sum, [, v]) => sum + v, 0) / (numOpts - 1);
        if (otherAvg === 0 || maxFill / otherAvg > RELATIVE_THRESHOLD) {
          detected[q] = bestOpt;
        }
      }
    }
  }

  return detected;
}

// ============================================
// ===== ROLL NUMBER DETECTION =====
// ============================================

function detectRollNumber(threshImg, grayImg) {
  const h = threshImg.rows;
  const w = threshImg.cols;
  const R = SHEET_COORDS;

  // Find markers and build mapper (reuse grayImg if available)
  const markers = grayImg ? findMarkersInWarped(grayImg) : null;
  const mapper = createSheetMapper(markers, w, h);

  const sampleR = Math.max(3, Math.round(R.rollBubbleR * mapper.scaleX * 0.7));

  let rollStr = '';

  for (const dc of R.rollDigits) {
    let maxFill = 0;
    let bestDigit = -1;

    for (let digit = 0; digit <= 9; digit++) {
      const pos = mapper(dc.cx, R.rollRow0cy + digit * R.rollRowStep);
      const cx = Math.round(pos.x);
      const cy = Math.round(pos.y);
      const r = sampleR;

      const x1 = Math.max(0, cx - r);
      const y1 = Math.max(0, cy - r);
      const x2 = Math.min(w - 1, cx + r);
      const y2 = Math.min(h - 1, cy + r);
      if (x2 <= x1 || y2 <= y1) continue;

      const roi = threshImg.roi(new cv.Rect(x1, y1, x2 - x1, y2 - y1));
      const nonZero = cv.countNonZero(roi);
      const total = roi.rows * roi.cols;
      const fill = total > 0 ? nonZero / total : 0;
      roi.delete();

      if (fill > maxFill) {
        maxFill = fill;
        bestDigit = digit;
      }
    }

    if (maxFill > 0.30 && bestDigit >= 0) {
      rollStr += bestDigit.toString();
    } else {
      rollStr += '?';
    }
  }

  console.log('Detected roll number:', rollStr);
  return rollStr.indexOf('?') === -1 ? rollStr : '';
}

// ============================================
// ===== SIMPLIFIED FALLBACK PROCESSING =====
// ============================================

function processSimplified() {
  showProcessing(true, 'সরল পদ্ধতিতে বিশ্লেষণ...');
  
  try {
    const canvas = document.getElementById('processingCanvas');
    const src = cv.imread(canvas);
    
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    showDebugImage('debugGray', gray);
    
    const blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    
    // Use Otsu's thresholding
    const thresh = new cv.Mat();
    cv.threshold(blurred, thresh, 0, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU);
    showDebugImage('debugThresh', thresh);
    
    // Morphological operations to clean up
    const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(3, 3));
    const cleaned = new cv.Mat();
    cv.morphologyEx(thresh, cleaned, cv.MORPH_CLOSE, kernel);
    
    showDebugImage('debugWarp', cleaned);
    
    // Detect circles (bubbles) using HoughCircles
    const detectedAnswers = detectBubblesCircle(gray, cleaned);
    
    // If circle detection also fails, use grid-based on the raw image
    let finalDetected = detectedAnswers;
    if (Object.keys(detectedAnswers).length === 0) {
      finalDetected = detectBubbles(cleaned, gray);
    }
    
    const result = gradeAnswers(finalDetected);
    
    // Detect roll from cleaned threshold image
    result.rollNumber = detectRollNumber(cleaned, gray);
    
    APP_STATE.currentResult = result;
    displayResults(result);
    
    document.getElementById('debugSection').classList.add('show');
    
    src.delete(); gray.delete(); blurred.delete(); thresh.delete();
    kernel.delete(); cleaned.delete();
    
    showProcessing(false);
    
    if (Object.keys(finalDetected).length > 0) {
      autoSaveAndContinue(result);
    } else {
      switchTab('results');
      showToast('বাবল সনাক্ত করা যায়নি। অনুগ্রহ করে ভালো মানের ছবি দিন।', 'error');
    }
    
  } catch(err) {
    console.error('Simplified processing error:', err);
    showProcessing(false);
    showToast('বিশ্লেষণ ব্যর্থ: ' + err.message, 'error');
  }
}

function detectBubblesCircle(grayImg, threshImg) {
  const detected = {};
  
  try {
    // Detect circles
    const circles = new cv.Mat();
    cv.HoughCircles(grayImg, circles, cv.HOUGH_GRADIENT, 1,
      grayImg.rows / 60,  // minDist
      100, 30,             // param1, param2
      Math.round(grayImg.rows * 0.008),   // minRadius
      Math.round(grayImg.rows * 0.025)    // maxRadius
    );
    
    if (circles.cols === 0) {
      circles.delete();
      return detected;
    }
    
    // Collect all detected circle centers
    const bubbles = [];
    for (let i = 0; i < circles.cols; i++) {
      const x = circles.data32F[i * 3];
      const y = circles.data32F[i * 3 + 1];
      const r = circles.data32F[i * 3 + 2];
      bubbles.push({ x, y, r });
    }
    circles.delete();
    
    if (bubbles.length < APP_STATE.numOptions) return detected;
    
    // Cluster bubbles into rows (similar y-coordinate)
    bubbles.sort((a, b) => a.y - b.y);
    
    const rows = [];
    let currentRow = [bubbles[0]];
    const yThreshold = grayImg.rows * 0.02;
    
    for (let i = 1; i < bubbles.length; i++) {
      const avgY = currentRow.reduce((s, b) => s + b.y, 0) / currentRow.length;
      if (Math.abs(bubbles[i].y - avgY) < yThreshold) {
        currentRow.push(bubbles[i]);
      } else {
        if (currentRow.length >= APP_STATE.numOptions) {
          rows.push([...currentRow]);
        }
        currentRow = [bubbles[i]];
      }
    }
    if (currentRow.length >= APP_STATE.numOptions) {
      rows.push(currentRow);
    }
    
    // Sort each row by x
    rows.forEach(row => row.sort((a, b) => a.x - b.x));
    
    // For each row, check which bubble is most filled
    let qNum = 1;
    for (const row of rows) {
      if (qNum > APP_STATE.numQuestions) break;
      
      // Take only the expected number of options from the row
      const optBubbles = row.slice(0, APP_STATE.numOptions);
      if (optBubbles.length < APP_STATE.numOptions) continue;
      
      let maxFill = 0;
      let bestIdx = -1;
      
      for (let i = 0; i < optBubbles.length; i++) {
        const b = optBubbles[i];
        const r = Math.round(b.r);
        const x1 = Math.max(0, Math.round(b.x - r));
        const y1 = Math.max(0, Math.round(b.y - r));
        const x2 = Math.min(threshImg.cols - 1, Math.round(b.x + r));
        const y2 = Math.min(threshImg.rows - 1, Math.round(b.y + r));
        
        if (x2 <= x1 || y2 <= y1) continue;
        
        const roi = threshImg.roi(new cv.Rect(x1, y1, x2 - x1, y2 - y1));
        const fill = cv.countNonZero(roi) / (roi.rows * roi.cols);
        roi.delete();
        
        if (fill > maxFill) {
          maxFill = fill;
          bestIdx = i;
        }
      }
      
      if (maxFill > 0.3 && bestIdx >= 0) {
        detected[qNum] = OPTION_LABELS[bestIdx];
      }
      
      qNum++;
    }
  } catch(err) {
    console.error('Circle detection error:', err);
  }
  
  return detected;
}

// ============================================
// ===== GRADING =====
// ============================================

function gradeAnswers(detectedAnswers) {
  const numQ = APP_STATE.numQuestions;
  const result = {
    total: numQ,
    correct: 0,
    wrong: 0,
    blank: 0,
    score: 0,
    maxScore: numQ * APP_STATE.marksCorrect,
    percentage: 0,
    answers: {},
    timestamp: new Date().toISOString(),
    examName: APP_STATE.examName,
    examClass: APP_STATE.examClass,
    examSubject: APP_STATE.examSubject,
    examSection: APP_STATE.examSection,
    rollNumber: ''
  };
  
  for (let q = 1; q <= numQ; q++) {
    const correctArr = APP_STATE.answerKey[q] || [];
    const detectedAns = detectedAnswers[q] || null;
    
    let status;
    if (!detectedAns) {
      status = 'blank';
      result.blank++;
    } else if (correctArr.length === 0) {
      // No answer key for this question
      status = 'blank';
      result.blank++;
    } else if (correctArr.indexOf(detectedAns) >= 0) {
      // Detected answer is one of the accepted correct answers
      status = 'correct';
      result.correct++;
      result.score += APP_STATE.marksCorrect;
    } else {
      status = 'wrong';
      result.wrong++;
      result.score -= APP_STATE.marksNegative;
    }
    
    result.answers[q] = {
      detected: detectedAns,
      correct: correctArr,
      status: status
    };
  }
  
  result.score = Math.max(0, result.score);
  result.percentage = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;
  
  return result;
}

// ============================================
// ===== RESULTS DISPLAY =====
// ============================================

function displayResults(result) {
  document.getElementById('noResultMsg').style.display = 'none';
  document.getElementById('resultContent').style.display = 'block';
  
  // Score circle
  const scoreCircle = document.getElementById('scoreCircle');
  const pct = result.percentage;
  if (pct >= 80) {
    scoreCircle.style.borderColor = 'var(--success)';
    document.getElementById('scoreNum').style.color = 'var(--success)';
  } else if (pct >= 50) {
    scoreCircle.style.borderColor = 'var(--accent)';
    document.getElementById('scoreNum').style.color = 'var(--accent)';
  } else {
    scoreCircle.style.borderColor = 'var(--error)';
    document.getElementById('scoreNum').style.color = 'var(--error)';
  }
  
  document.getElementById('scoreNum').textContent = result.score % 1 === 0 ? result.score : result.score.toFixed(2);
  document.getElementById('scorePercentText').textContent = `${result.percentage}% (${result.score}/${result.maxScore})`;
  const rollStr = result.rollNumber ? ('রোল: ' + result.rollNumber) : '';
  document.getElementById('examInfoText').textContent = 
    [rollStr, result.examName, result.examClass, result.examSubject].filter(Boolean).join(' | ') || '';
  
  document.getElementById('correctCount').textContent = result.correct;
  document.getElementById('wrongCount').textContent = result.wrong;
  document.getElementById('blankCount').textContent = result.blank;
  
  // Detailed answer grid
  const grid = document.getElementById('resultAnswerGrid');
  const numOpts = APP_STATE.numOptions;
  
  grid.innerHTML = '';
  for (let q = 1; q <= result.total; q++) {
    const ans = result.answers[q];
    const row = document.createElement('div');
    row.className = 'answer-row';
    
    let statusIcon = '';
    if (ans.status === 'correct') statusIcon = '✅';
    else if (ans.status === 'wrong') statusIcon = '❌';
    else statusIcon = '⬜';
    
    row.innerHTML = `
      <span class="answer-num">${statusIcon} ${q}</span>
      <div class="bubble-group">
        ${OPTION_LABELS.slice(0, numOpts).map(opt => {
          const correctArr = Array.isArray(ans.correct) ? ans.correct : (ans.correct ? [ans.correct] : []);
          let cls = 'bubble';
          if (ans.detected === opt && ans.status === 'correct') cls += ' correct';
          else if (ans.detected === opt && ans.status === 'wrong') cls += ' wrong';
          else if (correctArr.indexOf(opt) >= 0 && ans.status === 'wrong') cls += ' correct';
          else if (ans.detected === opt) cls += ' selected';
          return `<div class="${cls}">${opt}</div>`;
        }).join('')}
      </div>
    `;
    grid.appendChild(row);
  }
}

// ============================================
// ===== RESULT SAVING & HISTORY =====
// ============================================

function saveResult() {
  if (!APP_STATE.currentResult) {
    showToast('কোনো ফলাফল নেই!', 'error');
    return;
  }
  doSaveResult();
}

function autoSaveAndContinue(result) {
  APP_STATE.currentResult = result;
  displayResults(result);
  
  const roll = result.rollNumber || '';
  const keyId = APP_STATE.activeKeyId || '';
  
  // Check for duplicate roll WITHIN THE SAME answer key
  if (roll && keyId) {
    const history = loadFromStorage(STORAGE_KEYS.SCAN_HISTORY) || [];
    const duplicate = history.find(function(e) {
      return e.rollNumber === roll && e.answerKeyId === keyId;
    });
    if (duplicate) {
      showToast('Roll-' + roll + ' এই উত্তরপত্রে আগেই স্ক্যান হয়েছে। Skip করা হলো।', 'warning');
      // Resume scanning after short delay
      setTimeout(function() { resumeAutoScan(); }, 1500);
      return;
    }
  }
  
  // Save
  doSaveResult();
  
  // Show toast: "Roll-XX Saved XX answer"
  const msg = (roll ? 'Roll-' + roll : 'Roll-???') + ' Saved ' + result.correct + '/' + result.total;
  showToast(msg, 'success');
  
  // Resume scanning after short delay
  setTimeout(function() { resumeAutoScan(); }, 2000);
}

function resumeAutoScan() {
  // Re-start camera and auto-scan if not already running
  if (!APP_STATE.stream) {
    switchTab('scan');
    startCamera();
  } else {
    switchTab('scan');
    startAutoScan();
    updateScanStatus('📡 পরবর্তী শীটের জন্য প্রস্তুত... নতুন শীট ধরুন।', 'info');
  }
}

function doSaveResult() {
  const history = loadFromStorage(STORAGE_KEYS.SCAN_HISTORY) || [];
  
  const entry = {
    id: Date.now().toString(),
    answerKeyId: APP_STATE.activeKeyId || '',
    answerKeyName: APP_STATE.examName || 'নামহীন পরীক্ষা',
    ...APP_STATE.currentResult
  };
  
  history.unshift(entry);
  
  // Keep max 200 entries
  if (history.length > 200) history.length = 200;
  
  saveToStorage(STORAGE_KEYS.SCAN_HISTORY, history);
  displayResults(APP_STATE.currentResult); // refresh display with roll
  renderHistory();
  showToast('ফলাফল সংরক্ষিত! ' + (entry.rollNumber ? 'রোল: ' + entry.rollNumber : ''), 'success');
}

function renderHistory() {
  const history = loadFromStorage(STORAGE_KEYS.SCAN_HISTORY) || [];
  const container = document.getElementById('historyList');
  const summaryEl = document.getElementById('historySummary');
  const filterEl = document.getElementById('historyKeyFilter');
  
  // Build unique answer key list for the dropdown
  const keyMap = {};
  for (const e of history) {
    const kid = e.answerKeyId || '__none__';
    if (!keyMap[kid]) {
      keyMap[kid] = e.answerKeyName || e.examName || 'নামহীন পরীক্ষা';
    }
  }
  const currentFilter = filterEl ? filterEl.value : '__all__';
  if (filterEl) {
    const opts = ['<option value="__all__">— সকল উত্তরপত্র —</option>'];
    for (const kid in keyMap) {
      const sel = kid === currentFilter ? ' selected' : '';
      opts.push('<option value="' + kid + '"' + sel + '>' + keyMap[kid] + '</option>');
    }
    filterEl.innerHTML = opts.join('');
  }
  
  // Filter history
  const filtered = currentFilter === '__all__'
    ? history
    : history.filter(e => (e.answerKeyId || '__none__') === currentFilter);
  
  if (filtered.length === 0) {
    container.innerHTML = '<p style="color:var(--text-sec);text-align:center;padding:20px;">কোনো ইতিহাস নেই</p>';
    if (summaryEl) summaryEl.style.display = 'none';
    return;
  }
  
  // Summary stats for filtered set
  if (summaryEl && currentFilter !== '__all__') {
    const totalStudents = filtered.length;
    const avgScore = (filtered.reduce((s, e) => s + (e.percentage || 0), 0) / totalStudents).toFixed(1);
    const totalCorrect = filtered.reduce((s, e) => s + (e.correct || 0), 0);
    const totalWrong = filtered.reduce((s, e) => s + (e.wrong || 0), 0);
    summaryEl.style.display = 'block';
    summaryEl.innerHTML = '<strong>📊 ' + (keyMap[currentFilter] || '') + '</strong><br>' +
      '👨‍🎓 মোট শিক্ষার্থী: <strong>' + totalStudents + '</strong> | ' +
      '📈 গড় শতাংশ: <strong>' + avgScore + '%</strong><br>' +
      '✅ মোট সঠিক: ' + totalCorrect + ' | ❌ মোট ভুল: ' + totalWrong;
  } else if (summaryEl) {
    summaryEl.style.display = 'none';
  }
  
  container.innerHTML = filtered.map(entry => `
    <div class="history-item" onclick="viewHistoryEntry('${entry.id}')">
      <div class="history-info">
        <h4>${entry.rollNumber ? '🎓 রোল: ' + entry.rollNumber + ' — ' : ''}${entry.answerKeyName || entry.examName || 'নামহীন পরীক্ষা'}</h4>
        <p><strong>${entry.score}/${entry.maxScore} নম্বর</strong> | সঠিক: ${entry.correct} | ভুল: ${entry.wrong} | খালি: ${entry.blank}</p>
        <p>${entry.examClass || ''} ${entry.examSubject || ''} | ${new Date(entry.timestamp).toLocaleString('bn-BD')}</p>
      </div>
      <div class="history-score">${entry.percentage}%</div>
    </div>
  `).join('');
}

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
  var _ef = getFilteredHistory();
  var entries = _ef.entries, keyName = _ef.keyName;
  if (entries.length === 0) { showToast('কোনো ডাটা নেই!', 'error'); return; }

  var numQ = entries[0].total || 30;
  var totalStudents = entries.length;
  var avgPct = (entries.reduce(function(s, e){ return s + (e.percentage || 0); }, 0) / totalStudents).toFixed(1);
  var firstEntry = entries[0];

  // NOTE: closing tags are written as '<\/' + 'tag>' to prevent HTML parser
  // from prematurely terminating the <script> block that contains this code.
  var T = String.fromCharCode; // helper
  var SLASH = T(60) + T(47); // '</'

  var parts = [];
  parts.push('<!DOCTYPE html><html><head><meta charset="UTF-8">');
  parts.push('<title>OMR - ' + keyName + '<' + '/title>');
  parts.push('<style>');
  parts.push('body{font-family:Arial,sans-serif;margin:20px;color:#222;}');
  parts.push('h2{text-align:center;margin-bottom:4px;}');
  parts.push('.meta{text-align:center;color:#555;font-size:13px;margin-bottom:16px;}');
  parts.push('.sum{display:flex;justify-content:center;gap:24px;margin-bottom:12px;font-size:14px;}');
  parts.push('.sum b{color:#1565C0;}');
  parts.push('table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:20px;}');
  parts.push('th,td{border:1px solid #bbb;padding:4px 6px;text-align:center;}');
  parts.push('th{background:#1565C0;color:#fff;font-size:10px;}');
  parts.push('tr:nth-child(even){background:#f5f5f5;}');
  parts.push('.ok{color:#2E7D32;font-weight:bold;}.ng{color:#C62828;}.bl{color:#999;}');
  parts.push('@media print{@page{size:A4 landscape;margin:10mm;}body{margin:0;}}');
  parts.push(SLASH + 'style>');
  parts.push(SLASH + 'head>');
  parts.push('<body>');

  // Header
  parts.push('<h2>OMR ' + '\u09AB\u09B2\u09BE\u09AB\u09B2' + ' &mdash; ' + keyName + SLASH + 'h2>');
  parts.push('<div class="meta">');
  var metaParts = [firstEntry.examClass, firstEntry.examSubject, firstEntry.examSection].filter(Boolean);
  if (metaParts.length) parts.push(metaParts.join(' | ') + ' | ');
  parts.push(new Date().toLocaleDateString('bn-BD'));
  parts.push(SLASH + 'div>');

  // Summary
  parts.push('<div class="sum">');
  parts.push('<span>\u09AE\u09CB\u099F: <b>' + totalStudents + SLASH + 'b>' + SLASH + 'span>');
  parts.push('<span>\u0997\u09A1\u09BC: <b>' + avgPct + '%' + SLASH + 'b>' + SLASH + 'span>');
  parts.push('<span>\u09AA\u09CD\u09B0\u09B6\u09CD\u09A8: <b>' + numQ + SLASH + 'b>' + SLASH + 'span>');
  parts.push(SLASH + 'div>');

  // Table header
  parts.push('<table><thead><tr>');
  parts.push('<th>#' + SLASH + 'th><th>\u09B0\u09CB\u09B2' + SLASH + 'th>');
  parts.push('<th>\u09B8\u09CD\u0995\u09CB\u09B0' + SLASH + 'th><th>%' + SLASH + 'th>');
  parts.push('<th>\u09B8\u09A0\u09BF\u0995' + SLASH + 'th><th>\u09AD\u09C1\u09B2' + SLASH + 'th><th>\u0996\u09BE\u09B2\u09BF' + SLASH + 'th>');
  for (var q = 1; q <= numQ; q++) parts.push('<th>Q' + q + SLASH + 'th>');
  parts.push(SLASH + 'tr>' + SLASH + 'thead><tbody>');

  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    parts.push('<tr>');
    parts.push('<td>' + (i + 1) + SLASH + 'td>');
    parts.push('<td><b>' + (e.rollNumber || '-') + SLASH + 'b>' + SLASH + 'td>');
    parts.push('<td>' + e.score + '/' + e.maxScore + SLASH + 'td>');
    parts.push('<td>' + e.percentage + '%' + SLASH + 'td>');
    parts.push('<td class="ok">' + e.correct + SLASH + 'td>');
    parts.push('<td class="ng">' + e.wrong + SLASH + 'td>');
    parts.push('<td class="bl">' + e.blank + SLASH + 'td>');
    for (var q2 = 1; q2 <= numQ; q2++) {
      var a = e.answers ? e.answers[q2] : null;
      if (!a) { parts.push('<td>' + SLASH + 'td>'); continue; }
      if (a.status === 'correct') parts.push('<td class="ok">' + a.detected + SLASH + 'td>');
      else if (a.status === 'wrong') parts.push('<td class="ng">' + a.detected + SLASH + 'td>');
      else parts.push('<td class="bl">-' + SLASH + 'td>');
    }
    parts.push(SLASH + 'tr>');
  }
  parts.push(SLASH + 'tbody>' + SLASH + 'table>');
  parts.push('<p style="text-align:center;font-size:11px;color:#999;">OMR Scanner | ' + new Date().toLocaleString('bn-BD') + SLASH + 'p>');
  parts.push(SLASH + 'body>' + SLASH + 'html>');

  var html = parts.join('');

  // Open via blob URL to avoid document.write issues
  var blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  var blobUrl = URL.createObjectURL(blob);
  var win = window.open(blobUrl, '_blank');
  setTimeout(function() {
    if (win) { win.print(); }
    URL.revokeObjectURL(blobUrl);
  }, 1000);

  showToast('PDF \u09A4\u09C8\u09B0\u09BF \u09B9\u099A\u09CD\u099B\u09C7... Print dialog \u09A5\u09C7\u0995\u09C7 Save as PDF \u099A\u09BE\u09AA\u09C1\u09A8', 'success');
}

function clearFilteredHistory() {
  const filterEl = document.getElementById('historyKeyFilter');
  const currentFilter = filterEl ? filterEl.value : '__all__';
  if (currentFilter === '__all__') {
    clearHistory();
    return;
  }
  const keyName = filterEl.options[filterEl.selectedIndex].text;
  if (!confirm('"' + keyName + '" এর সকল স্ক্যান ইতিহাস মুছে ফেলবেন?')) return;
  let history = loadFromStorage(STORAGE_KEYS.SCAN_HISTORY) || [];
  history = history.filter(e => (e.answerKeyId || '__none__') !== currentFilter);
  saveToStorage(STORAGE_KEYS.SCAN_HISTORY, history);
  renderHistory();
  showToast('নির্বাচিত উত্তরপত্রের ইতিহাস মুছে ফেলা হয়েছে');
}

function viewHistoryEntry(id) {
  const history = loadFromStorage(STORAGE_KEYS.SCAN_HISTORY) || [];
  const entry = history.find(h => h.id === id);
  if (!entry) return;
  
  APP_STATE.currentResult = entry;
  APP_STATE.numQuestions = entry.total;
  APP_STATE.numOptions = 4; // default
  displayResults(entry);
  switchTab('results');
}

function clearHistory() {
  if (!confirm('সকল ইতিহাস মুছে ফেলবেন?')) return;
  saveToStorage(STORAGE_KEYS.SCAN_HISTORY, []);
  renderHistory();
  showToast('ইতিহাস মুছে ফেলা হয়েছে');
}

// ============================================
// ===== DEBUG HELPERS =====
// ============================================

function showDebugImage(canvasId, mat) {
  try {
    const canvas = document.getElementById(canvasId);
    cv.imshow(canvas, mat);
  } catch(e) {
    console.warn('Debug image error:', e);
  }
}

// ============================================
// ===== OMR SHEET GENERATOR (Canvas-based) =====
// ============================================

function drawOMRSheet(targetCanvas) {
  collectSetup();
  const numQ = 30;
  const numOpts = 4;
  const labels = ['A','B','C','D'];
  
  // A4 at 150 DPI: 1240 x 1754
  const W = 1240, H = 1754;
  targetCanvas.width = W;
  targetCanvas.height = H;
  const ctx = targetCanvas.getContext('2d');
  
  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);
  
  // ===== BORDER =====
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  
  // ===== 3 CORNER FIDUCIAL MARKERS (TL, TR, BL — BR intentionally absent = orientation) =====
  const markerSize = 34;
  const markerInset = 50;
  ctx.fillStyle = '#000';
  ctx.fillRect(markerInset, markerInset, markerSize, markerSize); // TL ✓
  ctx.fillRect(W - markerInset - markerSize, markerInset, markerSize, markerSize); // TR ✓
  ctx.fillRect(markerInset, H - markerInset - markerSize, markerSize, markerSize); // BL ✓
  // BR corner is INTENTIONALLY EMPTY — asymmetry encodes orientation

  // ===== TOP CROSS-MATCHING MARKS (3 crosshairs along top edge for skew detection) =====
  const crossY = markerInset + Math.floor(markerSize / 2);
  const crossLen = 16;
  const crossDot = 4;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2.5;
  for (const cxPos of [W * 0.25, W * 0.5, W * 0.75]) {
    ctx.beginPath(); ctx.moveTo(cxPos - crossLen, crossY); ctx.lineTo(cxPos + crossLen, crossY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cxPos, crossY - crossLen); ctx.lineTo(cxPos, crossY + crossLen); ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(cxPos, crossY, crossDot, 0, Math.PI * 2); ctx.fill();
  }

  // TOP label (small, centered under W/2 crosshair)
  ctx.font = 'bold 13px Arial';
  ctx.fillStyle = '#555';
  ctx.textAlign = 'center';
  ctx.fillText('\u25B2 TOP', W / 2, crossY + crossLen + 14);
  
  // ===== TITLE =====
  const titleY = 100;
  ctx.font = 'bold 26px Arial';
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.fillText('OMR Answer Sheet', W / 2, titleY);
  ctx.font = '13px Arial';


  // rollAreaY starts just below title (top info rows removed; info box is on right of roll grid)
  const infoY2 = titleY + 30;  // used only for rollAreaY offset below
  
  // ===== HANDWRITTEN ROLL BOX + BUBBLE ROLL =====
  const rollAreaY = infoY2 + 24;

  // Bigger roll bubbles
  const rollBubbleR  = 18;
  const rollDigitGap = 72;   // center-to-center of digit columns
  const rollRowH     = 38;   // row-to-row distance

  // Handwritten roll box label + 3 boxes
  ctx.font = 'bold 14px Arial';
  ctx.fillStyle = '#000';
  ctx.textAlign = 'left';
  ctx.fillText('Roll No (\u09B9\u09BE\u09A4\u09C7 \u09B2\u09BF\u0996\u09C1\u09A8):', 90, rollAreaY + 14);
  const boxW = 52, boxH = 56;
  const boxStartX = 90;
  const boxY = rollAreaY + 20;
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxStartX + i * (boxW + 6), boxY, boxW, boxH);
  }

  // OMR Roll Bubble grid
  const rollGridX = boxStartX + 3 * (boxW + 6) + 30;
  const rollGridY  = rollAreaY + 22;

  // Small centered label above all 3 digit columns (not overlapping any D-header)
  const rollGridLabelX = rollGridX + (3 * rollDigitGap) / 2;
  ctx.font = '11px Arial';
  ctx.fillStyle = '#666';
  ctx.textAlign = 'center';
  ctx.fillText('Roll (Bubble)', rollGridLabelX, rollAreaY + 10);

  for (let d = 0; d < 3; d++) {
    const dx = rollGridX + d * rollDigitGap;
    // D-column header
    ctx.font = 'bold 13px Arial';
    ctx.fillStyle = '#222';
    ctx.textAlign = 'center';
    ctx.fillText('D' + (d + 1), dx + rollBubbleR, rollGridY);

    // Reference tick above D-header for scan alignment
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(dx + rollBubbleR, rollGridY - 14);
    ctx.lineTo(dx + rollBubbleR, rollGridY - 6);
    ctx.stroke();

    for (let digit = 0; digit <= 9; digit++) {
      const bx = dx + rollBubbleR;
      const by = rollGridY + 16 + digit * rollRowH + rollBubbleR;

      ctx.beginPath();
      ctx.arc(bx, by, rollBubbleR, 0, Math.PI * 2);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.font = 'bold 13px Arial';
      ctx.fillStyle = '#888';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(digit.toString(), bx, by + 1);
    }
  }
  ctx.textBaseline = 'alphabetic';

  // ===== STUDENT INFO BOX (right side — where red box was) =====
  const infoBoxX  = rollGridX + 3 * rollDigitGap + 22;
  const infoBoxY  = rollAreaY - 4;
  const infoBoxW  = W - infoBoxX - 72;
  // Height = same as roll grid bottom
  const rollGridBottom = rollGridY + 16 + 10 * rollRowH + rollBubbleR + 10;
  const infoBoxH  = rollGridBottom - infoBoxY;

  // Border
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(infoBoxX, infoBoxY, infoBoxW, infoBoxH);

  // Title row inside box
  ctx.font = 'bold 13px Arial';
  ctx.fillStyle = '#222';
  ctx.textAlign = 'center';
  ctx.fillText('Student Information', infoBoxX + infoBoxW / 2, infoBoxY + 18);

  // Divider under title
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(infoBoxX + 8, infoBoxY + 24); ctx.lineTo(infoBoxX + infoBoxW - 8, infoBoxY + 24); ctx.stroke();

  const ipad  = 14;  // inner left padding
  const lh    = (infoBoxH - 32) / 4;  // 4 rows to fill
  const lineY = [infoBoxY + 32 + lh * 0.75, infoBoxY + 32 + lh * 1.75, infoBoxY + 32 + lh * 2.75, infoBoxY + 32 + lh * 3.75];

  ctx.font = 'bold 13px Arial';
  ctx.fillStyle = '#000';
  ctx.textAlign = 'left';
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;

  // Row 1: Name
  ctx.fillText('Name:', infoBoxX + ipad, lineY[0]);
  ctx.beginPath(); ctx.moveTo(infoBoxX + ipad + 52, lineY[0] + 3); ctx.lineTo(infoBoxX + infoBoxW - ipad, lineY[0] + 3); ctx.stroke();

  // Row 2: Roll No  |  Class
  const midX = infoBoxX + infoBoxW / 2;
  ctx.fillText('Roll No:', infoBoxX + ipad, lineY[1]);
  ctx.beginPath(); ctx.moveTo(infoBoxX + ipad + 62, lineY[1] + 3); ctx.lineTo(midX - 8, lineY[1] + 3); ctx.stroke();
  ctx.fillText('Class:', midX, lineY[1]);
  ctx.beginPath(); ctx.moveTo(midX + 50, lineY[1] + 3); ctx.lineTo(infoBoxX + infoBoxW - ipad, lineY[1] + 3); ctx.stroke();

  // Row 3: Section  |  Date
  ctx.fillText('Section:', infoBoxX + ipad, lineY[2]);
  ctx.beginPath(); ctx.moveTo(infoBoxX + ipad + 65, lineY[2] + 3); ctx.lineTo(midX - 8, lineY[2] + 3); ctx.stroke();
  ctx.fillText('Date:', midX, lineY[2]);
  ctx.beginPath(); ctx.moveTo(midX + 42, lineY[2] + 3); ctx.lineTo(infoBoxX + infoBoxW - ipad, lineY[2] + 3); ctx.stroke();

  // Row 4: Subject
  ctx.fillText('Subject:', infoBoxX + ipad, lineY[3]);
  ctx.beginPath(); ctx.moveTo(infoBoxX + ipad + 65, lineY[3] + 3); ctx.lineTo(infoBoxX + infoBoxW - ipad, lineY[3] + 3); ctx.stroke();

  // ===== DIVIDER =====
  const divY = rollGridBottom + 8;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(60, divY); ctx.lineTo(W - 60, divY); ctx.stroke();
  
  // ===== QUESTIONS AREA =====
  // rowHeight is computed to fill from divY to near the footer (H-75)
  // bubbleStartY ≈ divY + 22 + 34 = divY + 56
  const bubbleRadius = 20;
  const bubbleGap = 66;       // center-to-center; edge gap = 66-40 = 26px
  const questStartY = divY + 22;
  const bubbleStartY = questStartY + 34;
  // Fill available height: (H - 75 - 50) - bubbleStartY = (1754-75-50) - bubbleStartY
  const availH = (H - 75 - 50) - bubbleStartY;
  const rowHeight = Math.floor(availH / 10); // ≈ 106
  
  const colConfigs = [
    { startQ: 1,  endQ: 10, xBase: 80 },
    { startQ: 11, endQ: 20, xBase: 430 },
    { startQ: 21, endQ: 30, xBase: 780 }
  ];
  
  // Column separators
  ctx.strokeStyle = '#CCC';
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(405, questStartY - 20); ctx.lineTo(405, bubbleStartY + 10 * rowHeight + 20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(755, questStartY - 20); ctx.lineTo(755, bubbleStartY + 10 * rowHeight + 20); ctx.stroke();
  
  // Column headers & option labels
  ctx.textAlign = 'center';
  for (const col of colConfigs) {
    const headerX = col.xBase + 30 + (numOpts * bubbleGap) / 2;
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#333';
    ctx.fillText('Q' + col.startQ + '-' + col.endQ, headerX, questStartY + 2);
    for (let o = 0; o < numOpts; o++) {
      const bx = col.xBase + 65 + o * bubbleGap;
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#555';
      ctx.fillText(labels[o], bx, questStartY + 20);
    }
  }
  
  for (const col of colConfigs) {
    for (let q = col.startQ; q <= col.endQ; q++) {
      const row = q - col.startQ;
      const cy = bubbleStartY + row * rowHeight + bubbleRadius;
      
      // Question number
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'right';
      ctx.fillText(q.toString(), col.xBase + 42, cy + 6);
      
      // Bubbles
      for (let o = 0; o < numOpts; o++) {
        const cx = col.xBase + 65 + o * bubbleGap;
        
        ctx.beginPath();
        ctx.arc(cx, cy, bubbleRadius, 0, Math.PI * 2);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.font = '13px Arial';
        ctx.fillStyle = '#AAA';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labels[o], cx, cy + 1);
      }
    }
  }
  ctx.textBaseline = 'alphabetic';
  
  // ===== TIMING MARKS (left edge) =====
  for (let i = 0; i < 10; i++) {
    const ty = bubbleStartY + i * rowHeight + bubbleRadius - 6;
    ctx.fillStyle = '#000';
    ctx.fillRect(50, ty, 12, 12);
  }
  
  // ===== TIMING MARKS (right edge) =====
  for (let i = 0; i < 10; i++) {
    const ty = bubbleStartY + i * rowHeight + bubbleRadius - 6;
    ctx.fillStyle = '#000';
    ctx.fillRect(W - 62, ty, 12, 12);
  }
  
  // ===== BOTTOM TIMING MARKS: 12 filled bubbles + 12 open boxes =====
  const nTiming = 12;
  const bottomBarY = bubbleStartY + 10 * rowHeight + 22;
  const timingBubbleR = 10;
  const timingBoxSz = 18;
  const timingStartX = markerInset + Math.floor(markerSize / 2); // align with left corner marker center
  const timingEndX   = W - markerInset - Math.floor(markerSize / 2); // align with right corner marker center

  // Pixel-perfect positions using Math.round for exact symmetry
  const timingPositions = [];
  for (let i = 0; i < nTiming; i++) {
    timingPositions.push(Math.round(timingStartX + i * (timingEndX - timingStartX) / (nTiming - 1)));
  }

  // Row 1: 12 filled circles (timing reference bubbles)
  ctx.fillStyle = '#000';
  for (const tx of timingPositions) {
    ctx.beginPath();
    ctx.arc(tx, bottomBarY + timingBubbleR, timingBubbleR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Row 2: 12 open squares perfectly centered under each bubble
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.8;
  for (const tx of timingPositions) {
    ctx.strokeRect(Math.round(tx - timingBoxSz / 2), bottomBarY + timingBubbleR * 2 + 8, timingBoxSz, timingBoxSz);
  }
  
 
  
  return targetCanvas;
}

function downloadOMRSheet() {
  // Legacy alias: enforce dual-sheet output
  downloadDualSheet();
}

function downloadCanvasAsPNG() {
  // Legacy alias: enforce dual-sheet output
  downloadDualAsPNG();
}

function printOMRSheet() {
  // Legacy alias: enforce dual-sheet output
  printDualSheet();
}

// ===== DUAL LANDSCAPE SHEET (2-up on A4) =====

function drawOMRSheetDual(targetCanvas) {
  // Landscape A4 at 150 DPI: 1754 x 1240
  const LW = 1754, LH = 1240;
  targetCanvas.width = LW;
  targetCanvas.height = LH;
  const ctx = targetCanvas.getContext('2d');

  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, LW, LH);

  // Draw single sheet on offscreen canvas at full resolution
  const offscreen = document.createElement('canvas');
  drawOMRSheet(offscreen); // 1240 x 1754

  const halfW = Math.floor(LW / 2); // 877

  // Draw left sheet (scaled to fit halfW x LH)
  ctx.drawImage(offscreen, 0, 0, halfW, LH);

  // Draw right sheet (scaled to fit halfW x LH)
  ctx.drawImage(offscreen, halfW, 0, halfW, LH);

  // Dashed cut line between sheets
  ctx.setLineDash([8, 4]);
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(halfW, 0);
  ctx.lineTo(halfW, LH);
  ctx.stroke();
  ctx.setLineDash([]);

  // Scissors icon at top of cut line
  ctx.font = '16px Arial';
  ctx.fillStyle = '#999';
  ctx.textAlign = 'center';
  ctx.fillText('\u2702', halfW, 16);

  return targetCanvas;
}

function downloadDualSheet() {
  const canvas = document.getElementById('omrDualCanvas');
  drawOMRSheetDual(canvas);
  document.getElementById('dualPreviewCard').style.display = 'block';
  showToast('Landscape OMR \u09B6\u09C0\u099F \u09A4\u09C8\u09B0\u09BF \u09B9\u09AF\u09BC\u09C7\u099B\u09C7!', 'success');
}

function downloadDualAsPNG() {
  const canvas = document.getElementById('omrDualCanvas');
  if (!canvas.width) {
    drawOMRSheetDual(canvas);
  }
  const link = document.createElement('a');
  link.download = 'OMR_Sheet_30Q_Dual_A4.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('PNG \u09A1\u09BE\u0989\u09A8\u09B2\u09CB\u09A1 \u09B9\u099A\u09CD\u099B\u09C7...', 'success');
}

function printDualSheet() {
  const canvas = document.getElementById('omrDualCanvas');
  if (!canvas.width) {
    drawOMRSheetDual(canvas);
  }
  const dataUrl = canvas.toDataURL('image/png');
  const win = window.open('', '_blank');
  win.document.write(
    '<html><head><title>Print OMR Sheet (Dual)<\/title>' +
    '<style>@page{size:A4 landscape;}@media print{body{margin:0;}}body{display:flex;justify-content:center;align-items:flex-start;min-height:100vh;margin:0;padding:0;}<\/style>' +
    '<\/head><body>' +
    '<img src="' + dataUrl + '" style="width:100%;height:auto;" onload="window.print();">' +
    '<\/body><\/html>'
  );
  win.document.close();
}

// Legacy — called from Help modal
function generateOMRSheet() {
  downloadDualSheet();
  closeHelp();
}

// ============================================
// ===== UI HELPERS =====
// ============================================

function showToast(msg, type = '') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function showProcessing(show, text) {
  const overlay = document.getElementById('processingOverlay');
  if (show) {
    overlay.classList.add('show');
    if (text) document.getElementById('processingText').textContent = text;
  } else {
    overlay.classList.remove('show');
  }
}

function showHelp() {
  document.getElementById('helpModal').classList.add('show');
}

function closeHelp() {
  document.getElementById('helpModal').classList.remove('show');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// ===== INITIALIZATION =====
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  loadLastSetup();
  renderSavedKeys();
  renderHistory();
  
  // Build answer key grid if we have saved state
  collectSetup();
  buildAnswerKeyGrid();
  
  console.log('OMR Scanner initialized');
});

// Close modals on overlay click
document.getElementById('helpModal').addEventListener('click', function(e) {
  if (e.target === this) closeHelp();
});
