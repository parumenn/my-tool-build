<?php
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

$MESSAGES_FILE   = $DATA_DIR . '/messages.json';
$ATTEMPTS_FILE   = $DATA_DIR . '/login_attempts.json';
$TOKENS_FILE     = $DATA_DIR . '/active_tokens.json';
$ACCESS_LOG_FILE = $DATA_DIR . '/access_log.json';
$CONFIG_FILE     = $DATA_DIR . '/admin_config.json';

// Initial Setup: Create config with default password "admin123" if not exists
if (!file_exists($CONFIG_FILE)) {
    $defaultConfig = [
        'password_hash' => password_hash('admin123', PASSWORD_DEFAULT)
    ];
    file_put_contents($CONFIG_FILE, json_encode($defaultConfig, JSON_PRETTY_PRINT));
}

// Load Config
$config = json_decode(file_get_contents($CONFIG_FILE), true);

// Brute Force Settings
$MAX_ATTEMPTS = 5;
$LOCKOUT_TIME = 900; // 15 minutes

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

function get_client_ip() {
    return $_SERVER['REMOTE_ADDR'];
}

function load_json($file) {
    if (!file_exists($file)) return [];
    $content = file_get_contents($file);
    return json_decode($content, true) ?: [];
}

function save_json($file, $data) {
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
}

function verify_token($token) {
    global $TOKENS_FILE;
    $tokens = load_json($TOKENS_FILE);
    return isset($tokens[$token]) && $tokens[$token] > time();
}

// --- 1. Log Access (Public) ---
if ($action === 'log_access') {
    // Simple access logging
    $log = [
        'timestamp' => time(),
        'date' => date('Y-m-d H:i:s'),
        'ip' => get_client_ip(),
        'path' => $input['path'] ?? '/',
        'ua' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
    ];

    $logs = load_json($ACCESS_LOG_FILE);
    array_unshift($logs, $log);
    
    // Limit log size to 5000 entries
    if (count($logs) > 5000) {
        $logs = array_slice($logs, 0, 5000);
    }
    
    save_json($ACCESS_LOG_FILE, $logs);
    exit;
}

// --- 2. Send Message (Public) ---
if ($action === 'send') {
    if (empty($input['message'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Message is required']);
        exit;
    }

    $messages = load_json($MESSAGES_FILE);
    $newMessage = [
        'id' => uniqid(),
        'timestamp' => date('Y-m-d H:i:s'),
        'ip' => get_client_ip(),
        'name' => $input['name'] ?? 'Anonymous',
        'contact' => $input['contact'] ?? '',
        'message' => htmlspecialchars($input['message'])
    ];
    
    array_unshift($messages, $newMessage);
    save_json($MESSAGES_FILE, $messages);
    
    echo json_encode(['status' => 'success']);
    exit;
}

// --- 3. Login (Admin) ---
if ($action === 'login') {
    $ip = get_client_ip();
    $now = time();
    $attemptsData = load_json($ATTEMPTS_FILE);
    
    // Clean old attempts
    $attemptsData = array_filter($attemptsData, function($attempt) use ($now, $LOCKOUT_TIME) {
        return ($now - $attempt['time']) < $LOCKOUT_TIME;
    });

    // Check attempt count
    $myAttempts = array_filter($attemptsData, function($attempt) use ($ip) {
        return $attempt['ip'] === $ip;
    });

    if (count($myAttempts) >= $MAX_ATTEMPTS) {
        http_response_code(429);
        echo json_encode(['error' => '試行回数が上限を超えました。15分後に再試行してください。']);
        exit;
    }

    // Verify Password
    $password = $input['password'] ?? '';
    if (password_verify($password, $config['password_hash'])) {
        // Success
        $token = bin2hex(random_bytes(16));
        $tokens = load_json($TOKENS_FILE);
        $tokens[$token] = $now + 86400; // 24 hours
        save_json($TOKENS_FILE, $tokens);
        
        // Clear attempts
        $attemptsData = array_filter($attemptsData, function($attempt) use ($ip) {
            return $attempt['ip'] !== $ip;
        });
        save_json($ATTEMPTS_FILE, $attemptsData);

        echo json_encode(['token' => $token]);
    } else {
        // Fail
        $attemptsData[] = ['ip' => $ip, 'time' => $now];
        save_json($ATTEMPTS_FILE, $attemptsData);
        
        http_response_code(401);
        echo json_encode(['error' => 'パスワードが違います']);
    }
    exit;
}

// --- Protected Routes Middleware ---
$headers = getallheaders();
$token = $headers['X-Admin-Token'] ?? '';
if (!verify_token($token)) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// --- 4. Get Dashboard Data (Protected) ---
if ($action === 'fetch_dashboard') {
    $messages = load_json($MESSAGES_FILE);
    $logs = load_json($ACCESS_LOG_FILE);
    
    // Basic Analytics
    $now = time();
    $todayStart = strtotime('today midnight');
    $weekStart = strtotime('-7 days midnight');
    
    $stats = [
        'total_pv' => count($logs),
        'today_pv' => 0,
        'week_pv' => 0,
        'realtime_5min' => 0,
        'by_path' => [],
        'recent_logs' => array_slice($logs, 0, 100) // Return only latest 100 for table
    ];

    foreach ($logs as $log) {
        if ($log['timestamp'] >= $todayStart) $stats['today_pv']++;
        if ($log['timestamp'] >= $weekStart) $stats['week_pv']++;
        if ($log['timestamp'] >= $now - 300) $stats['realtime_5min']++;
        
        // Path stats (Top 10)
        $path = $log['path'];
        if (!isset($stats['by_path'][$path])) $stats['by_path'][$path] = 0;
        $stats['by_path'][$path]++;
    }
    
    arsort($stats['by_path']);
    $stats['by_path'] = array_slice($stats['by_path'], 0, 10);

    echo json_encode([
        'messages' => $messages,
        'stats' => $stats
    ]);
    exit;
}

// --- 5. Change Password (Protected) ---
if ($action === 'change_password') {
    $current = $input['current_password'] ?? '';
    $new = $input['new_password'] ?? '';
    
    if (!password_verify($current, $config['password_hash'])) {
        http_response_code(400);
        echo json_encode(['error' => '現在のパスワードが間違っています']);
        exit;
    }
    
    if (strlen($new) < 8) {
        http_response_code(400);
        echo json_encode(['error' => '新しいパスワードは8文字以上にしてください']);
        exit;
    }
    
    $config['password_hash'] = password_hash($new, PASSWORD_DEFAULT);
    file_put_contents($CONFIG_FILE, json_encode($config, JSON_PRETTY_PRINT));
    
    echo json_encode(['status' => 'success']);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Invalid action']);
?>