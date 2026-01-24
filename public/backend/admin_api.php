<?php
// JSONレスポンスを破壊するPHPのエラー出力を抑制
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
ini_set('display_errors', 0);

$start_time = microtime(true);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Admin-Token");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Composerのオートローダー読み込み（存在する場合のみ）
$has_phpmailer = false;
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require __DIR__ . '/vendor/autoload.php';
    $has_phpmailer = true;
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

// Initial Setup
if (!file_exists($CONFIG_FILE)) {
    $defaultConfig = [
        'password_hash' => password_hash('admin123', PASSWORD_DEFAULT),
        'smtp_host' => '',
        'smtp_port' => 587,
        'smtp_user' => '',
        'smtp_pass' => '',
        'alert_email' => ''
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

// --- Mail Helper Function ---
// 戻り値: 成功時は true (boolean), 失敗時はエラーメッセージ (string)
function send_alert_email($subject, $body) {
    global $config, $has_phpmailer;

    // ライブラリがない、または設定が不十分な場合はエラー文字列を返す
    if (!$has_phpmailer) return 'PHPMailerライブラリが見つかりません。サーバーで "composer require phpmailer/phpmailer" を実行してください。';
    if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) return 'PHPMailerクラスが見つかりません。';
    
    if (empty($config['smtp_host']) || empty($config['smtp_user']) || empty($config['alert_email'])) {
        return 'SMTP設定が未完了です。ホスト、ユーザー、通知先アドレスを入力してください。';
    }

    try {
        $mail = new \PHPMailer\PHPMailer\PHPMailer(true);

        // Server settings
        $mail->isSMTP();
        $mail->Host       = $config['smtp_host'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $config['smtp_user'];
        $mail->Password   = $config['smtp_pass'];
        $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = $config['smtp_port'];
        $mail->CharSet    = 'UTF-8';

        // Recipients
        $mail->setFrom($config['smtp_user'], 'OmniTools Admin');
        $mail->addAddress($config['alert_email']);

        // Content
        $mail->isHTML(false);
        $mail->Subject = "[OmniTools Alert] " . $subject;
        $mail->Body    = $body;

        $mail->send();
        return true;
    } catch (\Exception $e) {
        // エラー詳細を返す
        return '送信エラー: ' . $mail->ErrorInfo;
    }
}

// --- 1. Log Access (Public) ---
if ($action === 'log_access') {
    $duration = microtime(true) - $start_time;
    
    $log = [
        'timestamp' => time(),
        'date' => date('Y-m-d H:i:s'),
        'ip' => get_client_ip(),
        'path' => $input['path'] ?? '/',
        'ua' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
        'referer' => $input['referer'] ?? '',
        'status' => $input['status'] ?? 200,
        'response_time' => isset($input['load_time']) ? round($input['load_time'], 2) : round($duration * 1000, 2)
    ];

    $logs = load_json($ACCESS_LOG_FILE);
    array_unshift($logs, $log);
    
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

    // --- SECURITY ALERT: Brute Force Detected ---
    if (count($myAttempts) >= $MAX_ATTEMPTS) {
        // Send email only if it's the specific threshold attempt to avoid spamming on every click
        if (count($myAttempts) === $MAX_ATTEMPTS) {
            $subject = "不正アクセス検知 (Login Lockout)";
            $body = "管理者画面へのログイン試行回数が上限を超えました。\n\n" .
                    "IP Address: {$ip}\n" .
                    "Time: " . date('Y-m-d H:i:s') . "\n" .
                    "User Agent: " . ($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown');
            send_alert_email($subject, $body);
        }

        http_response_code(429);
        echo json_encode(['error' => '試行回数が上限を超えました。15分後に再試行してください。']);
        exit;
    }

    // Verify Password
    $password = $input['password'] ?? '';
    if (password_verify($password, $config['password_hash'])) {
        $token = bin2hex(random_bytes(16));
        $tokens = load_json($TOKENS_FILE);
        $tokens[$token] = $now + 86400; // 24 hours
        save_json($TOKENS_FILE, $tokens);
        
        $attemptsData = array_filter($attemptsData, function($attempt) use ($ip) {
            return $attempt['ip'] !== $ip;
        });
        save_json($ATTEMPTS_FILE, $attemptsData);

        echo json_encode(['token' => $token]);
    } else {
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
    
    $now = time();
    $todayStart = strtotime('today midnight');
    $weekStart = strtotime('-7 days midnight');
    
    $stats = [
        'total_pv' => count($logs),
        'today_pv' => 0,
        'week_pv' => 0,
        'realtime_5min' => 0,
        'by_path' => [],
        'recent_logs' => array_slice($logs, 0, 100)
    ];

    foreach ($logs as $log) {
        $ts = $log['timestamp'];
        if ($ts >= $todayStart) $stats['today_pv']++;
        if ($ts >= $weekStart) $stats['week_pv']++;
        if ($ts >= $now - 300) $stats['realtime_5min']++;
        
        $path = $log['path'] ?? '/';
        if (!isset($stats['by_path'][$path])) $stats['by_path'][$path] = 0;
        $stats['by_path'][$path]++;
    }
    
    arsort($stats['by_path']);
    $stats['by_path'] = array_slice($stats['by_path'], 0, 10);

    // Return partial config (exclude password hash) for settings form
    $safeConfig = [
        'smtp_host' => $config['smtp_host'] ?? '',
        'smtp_port' => $config['smtp_port'] ?? 587,
        'smtp_user' => $config['smtp_user'] ?? '',
        'alert_email' => $config['alert_email'] ?? ''
    ];

    echo json_encode([
        'messages' => $messages,
        'stats' => $stats,
        'config' => $safeConfig
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

// --- 5.5 Update SMTP Settings (Protected) ---
if ($action === 'update_smtp') {
    // Note: Password field is optional (only update if provided)
    $config['smtp_host'] = $input['smtp_host'];
    $config['smtp_port'] = intval($input['smtp_port']);
    $config['smtp_user'] = $input['smtp_user'];
    $config['alert_email'] = $input['alert_email'];
    
    if (!empty($input['smtp_pass'])) {
        $config['smtp_pass'] = $input['smtp_pass'];
    }

    file_put_contents($CONFIG_FILE, json_encode($config, JSON_PRETTY_PRINT));
    
    // Try sending a test email
    $testResult = send_alert_email("Test Mail", "これはSMTP設定のテストメールです。\n正しく設定されています。");
    
    if ($testResult === true) {
        echo json_encode(['status' => 'success', 'message' => '設定を保存し、テストメールを送信しました']);
    } else {
        // エラー詳細を含めて返す
        echo json_encode(['status' => 'warning', 'message' => '設定は保存されましたが、メール送信に失敗しました: ' . $testResult]);
    }
    exit;
}

// --- 6. Backup Data (Protected) ---
if ($action === 'backup_data') {
    $backup = [
        'config' => load_json($CONFIG_FILE),
        'access_log' => load_json($ACCESS_LOG_FILE),
        'messages' => load_json($MESSAGES_FILE),
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    header('Content-Type: application/json');
    echo json_encode($backup);
    exit;
}

// --- 7. Restore Data (Protected) ---
if ($action === 'restore_data') {
    $data = $input['data'] ?? null;
    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'No data provided']);
        exit;
    }
    
    if (isset($data['config'])) save_json($CONFIG_FILE, $data['config']);
    if (isset($data['access_log'])) save_json($ACCESS_LOG_FILE, $data['access_log']);
    if (isset($data['messages'])) save_json($MESSAGES_FILE, $data['messages']);
    
    echo json_encode(['status' => 'success']);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Invalid action']);
?>