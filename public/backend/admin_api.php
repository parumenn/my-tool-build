<?php
// JSONレスポンスを破壊するPHPのエラー出力を抑制
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
ini_set('display_errors', 0);

// 日本時間に設定
date_default_timezone_set('Asia/Tokyo');

$start_time = microtime(true);

// CORS / Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Admin-Token");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Configuration
$DATA_DIR = __DIR__ . '/data';
if (!file_exists($DATA_DIR)) {
    mkdir($DATA_DIR, 0777, true);
}

$MESSAGES_FILE    = $DATA_DIR . '/messages.json';
$ACCESS_LOG_FILE  = $DATA_DIR . '/access_log.json';
$CONFIG_FILE      = $DATA_DIR . '/admin_config.json';
$BLOCKED_IPS_FILE = $DATA_DIR . '/blocked_ips.json';
$REQ_TRACK_FILE   = $DATA_DIR . '/request_track.json';
$ATTEMPTS_FILE    = $DATA_DIR . '/login_attempts.json';
$TOKENS_FILE      = $DATA_DIR . '/active_tokens.json';

// Initial Setup
if (!file_exists($CONFIG_FILE)) {
    save_json($CONFIG_FILE, [
        'password_hash' => password_hash('admin123', PASSWORD_DEFAULT),
        'smtp_host' => '',
        'smtp_port' => 587,
        'smtp_user' => '',
        'smtp_pass' => '',
        'alert_email' => ''
    ]);
}

function load_json($file) {
    if (!file_exists($file)) return [];
    $content = file_get_contents($file);
    return json_decode($content, true) ?: [];
}

function save_json($file, $data) {
    file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
}

function get_client_ip() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) return $_SERVER['HTTP_CLIENT_IP'];
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) return explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
    return $_SERVER['REMOTE_ADDR'];
}

$current_ip = get_client_ip();
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

// 1. 公開アクション（ログイン等）
if ($action === 'login') {
    $now = time();
    $config = load_json($CONFIG_FILE);
    if (password_verify($input['password'] ?? '', $config['password_hash'])) {
        $token = bin2hex(random_bytes(16));
        $tokens = load_json($TOKENS_FILE);
        $tokens[$token] = $now + 86400; // 24時間有効
        save_json($TOKENS_FILE, $tokens);
        echo json_encode(['token' => $token]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'パスワードが正しくありません']);
    }
    exit;
}

if ($action === 'log_access') {
    $mtime = microtime(true);
    $ts = (int)$mtime;
    $ms = sprintf("%03d", ($mtime - $ts) * 1000);
    $log = [
        'timestamp' => $mtime, 
        'date' => date('Y-m-d H:i:s', $ts) . '.' . $ms, 
        'ip' => $current_ip, 
        'path' => $input['path'] ?? '/', 
        'ua' => $_SERVER['HTTP_USER_AGENT'] ?? '不明', 
        'status' => $input['status'] ?? 200
    ];
    $logs = load_json($ACCESS_LOG_FILE);
    array_unshift($logs, $log);
    save_json($ACCESS_LOG_FILE, array_slice($logs, 0, 5000));
    echo json_encode(['status' => '成功']);
    exit;
}

if ($action === 'send') {
    if (empty($input['message'])) { http_response_code(400); exit; }
    $messages = load_json($MESSAGES_FILE);
    array_unshift($messages, [
        'id' => uniqid(),
        'timestamp' => date('Y-m-d H:i:s'),
        'ip' => $current_ip,
        'name' => $input['name'] ?? '匿名',
        'contact' => $input['contact'] ?? '',
        'message' => htmlspecialchars($input['message'])
    ]);
    save_json($MESSAGES_FILE, $messages);
    echo json_encode(['status' => '成功']);
    exit;
}

// 2. 管理者認証チェック
$headers = getallheaders();
$token = $headers['X-Admin-Token'] ?? $headers['x-admin-token'] ?? '';
$tokens = load_json($TOKENS_FILE);
if (!isset($tokens[$token]) || $tokens[$token] < time()) {
    http_response_code(403);
    echo json_encode(['error' => '認証が必要です']);
    exit;
}

// 3. 管理者専用アクション
if ($action === 'fetch_dashboard') {
    $config = load_json($CONFIG_FILE);
    echo json_encode([
        'messages' => load_json($MESSAGES_FILE),
        'stats' => [
            'total_pv' => count(load_json($ACCESS_LOG_FILE)),
            'today_pv' => count(array_filter(load_json($ACCESS_LOG_FILE), function($l) { return $l['timestamp'] > strtotime('today midnight'); })),
            'recent_logs' => array_slice(load_json($ACCESS_LOG_FILE), 0, 500)
        ],
        'config' => [
            'smtp_host' => $config['smtp_host'] ?? '',
            'smtp_port' => $config['smtp_port'] ?? 587,
            'smtp_user' => $config['smtp_user'] ?? '',
            'alert_email' => $config['alert_email'] ?? ''
        ],
        'blocked_ips' => load_json($BLOCKED_IPS_FILE)
    ]);
} elseif ($action === 'update_smtp') {
    $config = load_json($CONFIG_FILE);
    // 既存の値をベースに、送信されてきた値のみ上書き
    if (isset($input['smtp_host'])) $config['smtp_host'] = trim($input['smtp_host']);
    if (isset($input['smtp_port'])) $config['smtp_port'] = intval($input['smtp_port']);
    if (isset($input['smtp_user'])) $config['smtp_user'] = trim($input['smtp_user']);
    if (isset($input['alert_email'])) $config['alert_email'] = trim($input['alert_email']);
    if (!empty($input['smtp_pass'])) $config['smtp_pass'] = $input['smtp_pass'];
    
    save_json($CONFIG_FILE, $config);
    echo json_encode(['status' => '成功']);
} elseif ($action === 'unblock_ip') {
    $blocked = load_json($BLOCKED_IPS_FILE);
    $ip = $input['ip'] ?? '';
    if (isset($blocked[$ip])) {
        unset($blocked[$ip]);
        save_json($BLOCKED_IPS_FILE, $blocked);
    }
    echo json_encode(['status' => '成功']);
} elseif ($action === 'import_data') {
    // データの一括復元
    if (isset($input['messages'])) save_json($MESSAGES_FILE, $input['messages']);
    if (isset($input['logs'])) save_json($ACCESS_LOG_FILE, $input['logs']);
    if (isset($input['config'])) {
        $current = load_json($CONFIG_FILE);
        $import = $input['config'];
        // パスワードハッシュは上書きせず保持
        $current['smtp_host'] = $import['smtp_host'] ?? $current['smtp_host'];
        $current['smtp_port'] = $import['smtp_port'] ?? $current['smtp_port'];
        $current['smtp_user'] = $import['smtp_user'] ?? $current['smtp_user'];
        $current['alert_email'] = $import['alert_email'] ?? $current['alert_email'];
        if (!empty($import['smtp_pass'])) $current['smtp_pass'] = $import['smtp_pass'];
        save_json($CONFIG_FILE, $current);
    }
    echo json_encode(['status' => '成功']);
}
?>