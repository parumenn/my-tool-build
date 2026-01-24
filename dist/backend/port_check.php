<?php
// Security headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json; charset=UTF-8");

// Get parameters
$target_ip = $_GET['ip'] ?? '';
$target_port = intval($_GET['port'] ?? 0);

// Basic Validation
if (empty($target_ip)) {
    // If no IP provided, use the requester's IP (REMOTE_ADDR)
    $target_ip = $_SERVER['REMOTE_ADDR'];
}

// Validate IP format
if (!filter_var($target_ip, FILTER_VALIDATE_IP)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid IP address']);
    exit;
}

// Validate Port
if ($target_port < 1 || $target_port > 65535) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid port number']);
    exit;
}

// Check Port using fsockopen
// Timeout set to 3 seconds to prevent long hangs
$connection = @fsockopen($target_ip, $target_port, $errno, $errstr, 3);

if (is_resource($connection)) {
    fclose($connection);
    echo json_encode([
        'status' => 'open',
        'ip' => $target_ip,
        'port' => $target_port,
        'message' => 'Port is open'
    ]);
} else {
    echo json_encode([
        'status' => 'closed',
        'ip' => $target_ip,
        'port' => $target_port,
        'message' => 'Port is closed or filtered',
        'error' => $errstr
    ]);
}
?>