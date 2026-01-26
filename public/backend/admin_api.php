<?php
ob_start();
error_reporting(0);
ini_set('display_errors', 0);

date_default_timezone_set('Asia/Tokyo');
$now = time();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Admin-Token");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    exit(0);
}

$DATA_DIR = __DIR__ . '/data';
if (!file_exists($DATA_DIR)) {
    mkdir($DATA_DIR, 0777, true);
    file_put_contents($DATA_DIR . '/.htaccess', "Order Deny,Allow\nDeny from all");
}

$MESSAGES_FILE    = $DATA_DIR . '/messages.json';
$ACCESS_LOG_FILE  = $DATA_DIR . '/access_log.json';
$CONFIG_FILE      = $DATA_DIR . '/admin_config.json';
$BLOCKED_IPS_FILE = $DATA_DIR . '/blocked_ips.json';
$REQ_TRACK_FILE   = $DATA_DIR . '/request_track.json';
$TOKENS_FILE      = $DATA_DIR . '/active_tokens.json';

function load_json($file) {
    if (!file_exists($file)) return [];
    $content = @file_get_contents($file);
    return json_decode($content, true) ?: [];
}
function save_json($file, $data) {
    @file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE), LOCK_EX);
}
function get_client_ip() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) return $_SERVER['HTTP_CLIENT_IP'];
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) return explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
    return $_SERVER['REMOTE_ADDR'];
}

// ヘッダー取得のフォールバック
function get_admin_token() {
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        if (isset($headers['X-Admin-Token'])) return $headers['X-Admin-Token'];
        if (isset($headers['x-admin-token'])) return $headers['x-admin-token'];
    }
    return $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';
}

function get_server_stats() {
    $stats = ['cpu' => 0, 'mem' => ['total' => 0, 'used' => 0, 'percent' => 0], 'disk' => ['total' => 0, 'used' => 0, 'percent' => 0]];
    if (function_exists('sys_getloadavg')) { $load = @sys_getloadavg(); if ($load) $stats['cpu'] = $load[0] * 10; }
    if (@file_exists('/proc/meminfo')) {
        $meminfo = @file_get_contents('/proc/meminfo');
        if ($meminfo) {
            if (preg_match('/MemTotal:\s+(\d+)/', $meminfo, $matches)) $stats['mem']['total'] = $matches[1] * 1024;
            if (preg_match('/MemAvailable:\s+(\d+)/', $meminfo, $matches)) {
                $available = $matches[1] * 1024;
                $stats['mem']['used'] = $stats['mem']['total'] - $available;
                if ($stats['mem']['total'] > 0) $stats['mem']['percent'] = round(($stats['mem']['used'] / $stats['mem']['total']) * 100, 1);
            }
        }
    }
    $disk_total = @disk_total_space('/'); $disk_free = @disk_free_space('/');
    if ($disk_total !== false && $disk_free !== false) {
        $stats['disk']['total'] = $disk_total; $stats['disk']['used'] = $disk_total - $disk_free;
        if ($disk_total > 0) $stats['disk']['percent'] = round(($stats['disk']['used'] / $disk_total) * 100, 1);
    }
    return $stats;
}

$default_config = [
    'password_hash' => password_hash('admin123', PASSWORD_DEFAULT),
    'smtp_host' => '', 'smtp_port' => 587, 'smtp_user' => '', 'smtp_pass' => '', 'alert_email' => '',
    'dos_patterns' => [['count' => 30, 'seconds' => 30, 'block_minutes' => 15]],
    'dos_notify_enabled' => true
];
$config = array_merge($default_config, load_json($CONFIG_FILE));
$ip = get_client_ip();
$blocked = load_json($BLOCKED_IPS_FILE);
$blocked = array_filter($blocked, function($b) use ($now) { return $b['expiry'] > $now; });

if (isset($blocked[$ip])) {
    ob_clean();
    http_response_code(403);
    echo json_encode(['error' => 'IP Blocked']);
    exit;
}

$token_header = get_admin_token();
$tokens = load_json($TOKENS_FILE);
$is_admin = !empty($token_header) && isset($tokens[$token_header]) && $tokens[$token_header] > $now;

// DOS保護（管理者以外に適用）
if (!$is_admin) {
    $track = load_json($REQ_TRACK_FILE);
    if (!isset($track[$ip])) $track[$ip] = ['times' => []];
    $track[$ip]['times'][] = $now;
    $track[$ip]['times'] = array_values(array_filter($track[$ip]['times'], function($t) use ($now) { return $t > ($now - 3600); }));
    $is_violated = false;
    foreach ($config['dos_patterns'] as $p) {
        $recent_hits = array_filter($track[$ip]['times'], function($t) use ($now, $p) { return $t > ($now - $p['seconds']); });
        if (count($recent_hits) > $p['count']) { $is_violated = true; break; }
    }
    if ($is_violated) {
        $blocked[$ip] = ['expiry' => $now + 900, 'time' => date('Y-m-d H:i:s'), 'reason' => 'DOS Detect'];
        save_json($BLOCKED_IPS_FILE, $blocked);
        ob_clean();
        http_response_code(429);
        echo json_encode(['error' => 'Too many requests']);
        exit;
    }
    save_json($REQ_TRACK_FILE, $track);
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

$response = null;

if ($action === 'login') {
    if (password_verify($input['password'] ?? '', $config['password_hash'])) {
        $token = bin2hex(random_bytes(16));
        $tokens[$token] = $now + 86400;
        save_json($TOKENS_FILE, $tokens);
        $response = ['token' => $token];
    } else {
        http_response_code(401);
        $response = ['error' => 'Invalid password'];
    }
} elseif ($action === 'log_access') {
    $logs = load_json($ACCESS_LOG_FILE);
    array_unshift($logs, [
        'timestamp' => microtime(true), 
        'date' => date('Y-m-d H:i:s'), 
        'ip' => $ip, 
        'path' => $input['path'] ?? '/', 
        'status' => $input['status'] ?? 200
    ]);
    save_json($ACCESS_LOG_FILE, array_slice($logs, 0, 1000));
    $response = ['status' => 'ok'];
} elseif ($action === 'fetch_dashboard' && $is_admin) {
    $logs = load_json($ACCESS_LOG_FILE);
    $total_pv = count($logs);
    $today = date('Y-m-d');
    $today_pv = 0;
    foreach ($logs as $l) {
        if (strpos($l['date'], $today) === 0) $today_pv++;
    }

    $response = [
        'stats' => [
            'total_pv' => $total_pv, 
            'today_pv' => $today_pv, 
            'recent_logs' => array_slice($logs, 0, 100)
        ], 
        'blocked_ips' => $blocked, 
        'server_resources' => get_server_stats(),
        'messages' => load_json($MESSAGES_FILE),
        'config' => [
            'smtp_host' => $config['smtp_host'],
            'smtp_port' => $config['smtp_port'],
            'smtp_user' => $config['smtp_user'],
            'alert_email' => $config['alert_email'],
            'dos_patterns' => $config['dos_patterns'],
            'dos_notify_enabled' => $config['dos_notify_enabled']
        ]
    ];
} else {
    $response = ['status' => 'ignored'];
}

ob_clean();
echo json_encode($response);
exit;
