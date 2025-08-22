<?php
header('Content-Type: application/json');
// Replace with your real API key
$API_KEY = 'VnIzbggbJpER8JkqAMyC';
// Default sender id (can be overridden by client)
$DEFAULT_SENDER = '8809617611082';

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);
if(!is_array($input)) {
    // fallback to POST form-data
    $input = $_POST;
}

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
    // Expecting $messages to be an array of {to:..., message:...}
    $payload = [
        'api_key' => $API_KEY,
        'senderid' => $senderid,
        'messages' => $messages
    ];
    $resp = curl_post_json('http://bulksmsbd.net/api/smsapimany', $payload);
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

// Unknown mode
echo json_encode(['error' => true, 'message' => 'Invalid mode']);
exit;
