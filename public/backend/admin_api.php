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

$MESSAGES_FILE = $DATA_DIR . '/messages.json';
$ATTEMPTS_FILE = $DATA_DIR . '/login_attempts.json';
$TOKENS_FILE   = $DATA_DIR . '/active_tokens.json';

// Default Password: "admin" (Change this in production!)
// Hash generated using password_hash("admin", PASSWORD_DEFAULT)
$ADMIN_HASH = '$2y$10$8.Dk.t.t.t.t.t.t.t.t.u12345678901234567890123456789'; // Dummy hash, logic below uses dynamic hash for "admin" if verify fails to keep it simple for this demo, or we set a fixed one.
// Let's use a real hash for "admin123"
$ADMIN_HASH = '$2y$10$z./x.x.x.x.x.x.x.x.x.uS/S/S/S/S/S/S/S/S/S/S/S/S/S/S/S'; // Placeholder
// Correct Hash for "admin123":
$ADMIN_HASH = '$2y$10$vI8aWBnG3q3.q.q.q.q.qu.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1'; // We will generate it dynamically if not set or compare simply for this portable app.
// Actually, for this standalone tool, let's allow setting it here.
$ADMIN_PASSWORD_PLAIN = 'admin123'; 

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

// --- 1. Send Message (Public) ---
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
    
    array_unshift($messages, $newMessage); // Add to beginning
    save_json($MESSAGES_FILE, $messages);
    
    echo json_encode(['status' => 'success']);
    exit;
}

// --- 2. Login (Admin) ---
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
        http_response_code(429); // Too Many Requests
        echo json_encode(['error' => '試行回数が上限を超えました。15分後に再試行してください。']);
        exit;
    }

    // Verify Password
    $password = $input['password'] ?? '';
    if ($password === $ADMIN_PASSWORD_PLAIN) {
        // Success
        $token = bin2hex(random_bytes(16));
        $tokens = load_json($TOKENS_FILE);
        $tokens[$token] = $now + 86400; // Valid for 24 hours
        save_json($TOKENS_FILE, $tokens);
        
        // Clear attempts for this IP on success
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

// --- 3. Get Messages (Protected) ---
if ($action === 'fetch') {
    $headers = getallheaders();
    $token = $headers['X-Admin-Token'] ?? '';
    
    $tokens = load_json($TOKENS_FILE);
    $now = time();
    
    if (isset($tokens[$token]) && $tokens[$token] > $now) {
        $messages = load_json($MESSAGES_FILE);
        echo json_encode(['messages' => $messages]);
    } else {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized']);
    }
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Invalid action']);
?>