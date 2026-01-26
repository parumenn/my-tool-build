<?php
// Increase memory limit and execution time for speed tests
ini_set('memory_limit', '512M');
ini_set('max_execution_time', 300);

// Allow CORS if necessary (adjust for security in production)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$action = $_GET['action'] ?? '';

if ($action === 'download') {
    // Generate random binary data
    // Size in MB, default 5MB, max 50MB
    $sizeMB = isset($_GET['size']) ? intval($_GET['size']) : 5;
    if ($sizeMB > 50) $sizeMB = 50;
    if ($sizeMB < 1) $sizeMB = 1;

    $bytes = $sizeMB * 1024 * 1024;
    
    header('Content-Type: application/octet-stream');
    header('Content-Length: ' . $bytes);
    header('Cache-Control: no-cache, no-store, must-revalidate');

    // Output chunks to avoid memory exhaustion
    $chunkSize = 1024 * 1024; // 1MB chunks
    $data = openssl_random_pseudo_bytes($chunkSize);

    for ($i = 0; $i < $sizeMB; $i++) {
        echo $data;
        flush();
    }
} elseif ($action === 'upload') {
    // Accept upload and discard it
    // Calculate size received
    $input = file_get_contents('php://input');
    $received = strlen($input);
    
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'ok',
        'received_bytes' => $received
    ]);
} else {
    http_response_code(400);
    echo "Invalid action";
}
