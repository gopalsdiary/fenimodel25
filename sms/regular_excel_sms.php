<?php
header('Content-Type: application/json');
// If this script receives a JSON POST with mode=single|bulk|balance, act as proxy.
if($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true);
    if(!is_array($input)) {
        $input = $_POST;
    }

    // Configure your API key and default sender here
    $API_KEY = 'VnIzbggbJpER8JkqAMyC';
    $DEFAULT_SENDER = '8809617611082';

    $mode = isset($input['mode']) ? $input['mode'] : null;
    $senderid = isset($input['senderid']) ? $input['senderid'] : $DEFAULT_SENDER;

    function curl_post_json($url, $data) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
        $response = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);
        if($err) {
            return json_encode(['error' => true, 'message' => $err]);
        }
        return $response;
    }

    // simple logger
    $LOGFILE = __DIR__ . '/sms_send.log';
    function write_log($file, $entry) {
        $line = json_encode($entry, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE) . PHP_EOL;
        @file_put_contents($file, $line, FILE_APPEND | LOCK_EX);
    }

    // read last N lines from log
    function tail_lines($file, $lines = 50) {
        if(!file_exists($file)) return '';
        $fp = fopen($file, 'r');
        $pos = -1;
        $line = '';
        $data = '';
        $count = 0;
        fseek($fp, 0, SEEK_END);
        $filesize = ftell($fp);
        while($filesize + $pos >= 0 && $count < $lines) {
            fseek($fp, $pos, SEEK_END);
            $char = fgetc($fp);
            if($char === "\n") {
                $count++;
                if($count === $lines) break;
            }
            $pos--;
        }
        if($pos < 0) fseek($fp, 0);
        $data = stream_get_contents($fp);
        fclose($fp);
        return $data;
    }

    if($mode === 'balance') {
        $url = "http://bulksmsbd.net/api/getBalanceApi?api_key=" . urlencode($API_KEY);
        $resp = @file_get_contents($url);
        if($resp === false) {
            echo json_encode(['error' => true, 'message' => 'Could not contact balance API']);
            exit;
        }
        echo $resp;
        exit;
    }

    if($mode === 'bulk') {
        $messages = isset($input['messages']) ? $input['messages'] : [];
        $payload = [
            'api_key' => $API_KEY,
            'senderid' => $senderid,
            'messages' => $messages
        ];
    // log request
    write_log($LOGFILE, ['time' => date('c'), 'type' => 'bulk_request', 'payload' => $payload]);
    $resp = curl_post_json('http://bulksmsbd.net/api/smsapimany', $payload);
    // log response
    write_log($LOGFILE, ['time' => date('c'), 'type' => 'bulk_response', 'response' => $resp]);
    echo $resp;
        exit;
    }

    if($mode === 'single') {
        $number = isset($input['number']) ? $input['number'] : '';
        $message = isset($input['message']) ? $input['message'] : '';
        $payload = [
            'api_key' => $API_KEY,
            'type' => 'text',
            'number' => $number,
            'senderid' => $senderid,
            'message' => $message
        ];
        $resp = curl_post_json('http://bulksmsbd.net/api/smsapi', $payload);
        echo $resp;
        exit;
    }

    if($mode === 'readlog') {
        header('Content-Type: text/plain; charset=UTF-8');
        $out = tail_lines($LOGFILE, 200);
        echo $out;
        exit;
    }

    echo json_encode(['error' => true, 'message' => 'Invalid mode']);
    exit;
}

// If not POST proxy, output the HTML UI below. We'll send Content-Type text/html for the UI.
header('Content-Type: text/html; charset=UTF-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Regular Excel SMS Portal</title>
    <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; background: #f6f8fa; margin: 0; }
        .sidebar { width: 220px; background: #fff; height: 100vh; position: fixed; left: 0; top: 0; box-shadow: 1px 0 8px #eee; }
        .sidebar ul { list-style: none; padding: 0; margin: 0; }
        .sidebar li { padding: 18px 24px; border-bottom: 1px solid #f0f0f0; cursor: pointer; color: #34495e; }
        .sidebar li.active, .sidebar li:hover { background: #eaf6ff; font-weight: bold; }
        .main { margin-left: 240px; padding: 32px; }
        h2 { color: #2c3e50; }
        .excel-upload { margin-bottom: 24px; }
        table { border-collapse: collapse; width: 100%; background: #fff; }
        th, td { border: 1px solid #bfc9d1; padding: 8px 12px; text-align: left; }
        th { background: #eaf6ff; }
        .status-success { color: green; font-weight: bold; }
        .status-fail { color: red; font-weight: bold; }
        .send-btn { margin-top: 18px; padding: 10px 24px; background: #3498db; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
        .send-btn:disabled { background: #bfc9d1; cursor: not-allowed; }
    </style>
</head>
<body>
    <div class="sidebar">
        <ul>
            <li>Dashboard</li>
            <li class="active">Regular excel SMS</li>
            <li>Refill SMS</li>
            <li>Logout</li>
        </ul>
    </div>
    <div class="main">
        <h2>Regular excel SMS <span style="font-size:14px;color:#888;">Send SMS from excel</span></h2>
        <div class="excel-upload">
            <input type="file" id="excelFile" accept=".xlsx,.xls" />
        </div>
        <table id="smsTable" style="display:none;">
            <thead>
                <tr>
                    <th>#</th>
                    <th>phone</th>
                    <th>body</th>
                    <th>status</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
        <div id="manualRowArea" style="margin-top:18px;">
        <input type="text" id="manualPhone" placeholder="Type phone number" style="width:180px;" />
        <input type="text" id="manualBody" placeholder="Type SMS body" style="width:320px;" />
        <button class="send-btn" id="addRowBtn" type="button" style="background:#27ae60;">Add Row</button>
        <button class="send-btn" id="sendSingleBtn" type="button" style="background:#e67e22; margin-left:10px;">Send</button>
        </div>
        <button class="send-btn" id="sendAllBtn" style="display:none;">Send All SMS</button>
    <button class="send-btn" id="viewLogBtn" style="display:inline-block; margin-left:12px; background:#7f8c8d;">View Log</button>
    </div>
    <script>
        document.getElementById('sendSingleBtn').onclick = async function() {
            let phone = document.getElementById('manualPhone').value.trim();
            const body = document.getElementById('manualBody').value.trim();
            if(phone && body) {
                if(!phone.startsWith('+88')) {
                    phone = '+88' + phone.replace(/^\+?88/, '');
                }
                document.getElementById('sendSingleBtn').textContent = 'Sending...';
                try {
                    const res = await fetch('regular_excel_sms.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ mode: 'single', number: phone, message: body })
                    });
                    const result = await res.json();
                    alert(result.response_code === 200 ? 'SMS Sent Successfully!' : 'SMS Send Failed! ' + (result.error_message||''));
                } catch (e) {
                    alert('SMS Send Failed! ' + e);
                }
                document.getElementById('sendSingleBtn').textContent = 'Send';
            }
        };
        let smsRows = [];
        document.getElementById('excelFile').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(evt) {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(sheet, {header:1});
                // Expecting header: phone, body
                smsRows = [];
                for(let i=1; i<json.length; i++) {
                    const row = json[i];
                    if(row[0] && row[1]) {
                        smsRows.push({phone: row[0], body: row[1], status: ''});
                    }
                }
                renderTable();
            };
            reader.readAsArrayBuffer(file);
        });

        document.getElementById('addRowBtn').onclick = function() {
            let phone = document.getElementById('manualPhone').value.trim();
            const body = document.getElementById('manualBody').value.trim();
            if(phone && body) {
                if(!phone.startsWith('+88')) {
                    phone = '+88' + phone.replace(/^\+?88/, '');
                }
                smsRows.push({phone: phone, body: body, status: ''});
                document.getElementById('manualPhone').value = '';
                document.getElementById('manualBody').value = '';
                renderTable();
            }
        };
        function renderTable() {
            const table = document.getElementById('smsTable');
            const tbody = table.querySelector('tbody');
            tbody.innerHTML = '';
            smsRows.forEach((row, idx) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${idx+1}</td><td>${row.phone}</td><td>${row.body}</td><td class="${row.status==='Success'?'status-success':row.status==='Fail'?'status-fail':''}">${row.status||''}</td>`;
                tbody.appendChild(tr);
            });
            table.style.display = smsRows.length ? '' : 'none';
            document.getElementById('sendAllBtn').style.display = smsRows.length ? '' : 'none';
        }
        document.getElementById('sendAllBtn').onclick = async function() {
            if(!smsRows.length) return;
            // prepare bulk messages
            const messages = smsRows.map(r => {
                let phone = r.phone + '';
                if(!phone.startsWith('+88')) phone = '+88' + phone.replace(/^\+?88/, '');
                return { to: phone, message: r.body };
            });
            // show sending status
            smsRows.forEach((r,i) => { r.status = 'Queued'; });
            renderTable();
            try {
                const res = await fetch('regular_excel_sms.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mode: 'bulk', messages: messages })
                });
                const resultText = await res.text();
                let result;
                try { result = JSON.parse(resultText); } catch(e) { result = { raw: resultText }; }
                // show detailed response
                alert('Bulk response:\n' + JSON.stringify(result, null, 2));
                // update rows to sent (best-effort)
                smsRows.forEach((r,i) => { r.status = 'Sent'; });
                renderTable();
            } catch (e) {
                alert('Bulk send failed: ' + e);
                smsRows.forEach((r,i) => { r.status = 'Fail'; });
                renderTable();
            }
        };

        document.getElementById('viewLogBtn').onclick = async function() {
            try {
                const res = await fetch('regular_excel_sms.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mode: 'readlog' })
                });
                const text = await res.text();
                const win = window.open('','_blank','width=800,height=600');
                win.document.write('<pre>' + text.replace(/</g,'&lt;') + '</pre>');
            } catch (e) {
                alert('Could not load log: ' + e);
            }
        };
    </script>

</body>
</html>
