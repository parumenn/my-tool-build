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

// getallheaders Polyfill for Nginx/FPM
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headerName = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
                $headers[$headerName] = $value;
            }
        }
        return $headers;
    }
}

// Composerのオートローダー読み込み（存在する場合のみ）
$has_phpmailer = false;
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
    $has_phpmailer = true;
}

// Configuration
$DATA_DIR = __DIR__ . '/data';
if (!file_exists($DATA_DIR)) {
    if (!mkdir($DATA_DIR, 0777, true)) {
        // 権限エラーでディレクトリが作れない場合
        error_log("Failed to create data directory");
    }
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
    // データの保存を試みる
    if (file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT)) === false) {
        error_log("Failed to write to $file");
    }
}

function verify_token($token) {
    global $TOKENS_FILE;
    if (empty($token)) return false;
    $tokens = load_json($TOKENS_FILE);
    return isset($tokens[$token]) && $tokens[$token] > time();
}

/**
 * Minimal SMTP Client for environments without Composer/PHPMailer
 */
class MinimalSMTP {
    private $host;
    private $port;
    private $user;
    private $pass;
    private $socket;
    private $timeout = 10;
    public $debugLog = [];

    public function __construct($host, $port, $user, $pass) {
        $this->host = $host;
        $this->port = $port;
        $this->user = $user;
        $this->pass = $pass;
    }

    private function log($msg) {
        $this->debugLog[] = $msg;
    }

    public function send($to, $subject, $body, $fromName = 'OmniTools Admin') {
        try {
            $protocol = ($this->port == 465) ? 'ssl://' : '';
            $hostAddress = $protocol . $this->host;

            $this->log("Connecting to $hostAddress:{$this->port}");
            $this->socket = @fsockopen($hostAddress, $this->port, $errno, $errstr, $this->timeout);
            
            if (!$this->socket) {
                throw new Exception("Connection failed: $errstr ($errno)");
            }

            $this->read();
            $this->cmd('EHLO ' . ($_SERVER['SERVER_NAME'] ?? 'localhost'));

            if ($this->port == 587) {
                $this->cmd('STARTTLS');
                $cryptoMethod = STREAM_CRYPTO_METHOD_TLS_CLIENT;
                if (defined('STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT')) {
                    $cryptoMethod |= STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT;
                }
                if (!stream_socket_enable_crypto($this->socket, true, $cryptoMethod)) {
                    throw new Exception("TLS handshake failed");
                }
                $this->cmd('EHLO ' . ($_SERVER['SERVER_NAME'] ?? 'localhost'));
            }

            $this->cmd('AUTH LOGIN');
            $this->cmd(base64_encode($this->user));
            $this->cmd(base64_encode($this->pass));

            $this->cmd("MAIL FROM: <{$this->user}>");
            $this->cmd("RCPT TO: <$to>");
            $this->cmd('DATA');

            $headers  = "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
            $headers .= "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <{$this->user}>\r\n";
            $headers .= "To: <$to>\r\n";
            $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
            $headers .= "Date: " . date("r") . "\r\n";

            $this->cmd($headers . "\r\n" . $body . "\r\n.");
            $this->cmd('QUIT');

            fclose($this->socket);
            return true;
        } catch (Exception $e) {
            if ($this->socket) @fclose($this->socket);
            return $e->getMessage() . " [Log: " . implode("; ", $this->debugLog) . "]";
        }
    }

    private function cmd($command) {
        fputs($this->socket, $command . "\r\n");
        $response = $this->read();
        $code = substr($response, 0, 3);
        if ($code >= 400) {
            throw new Exception("SMTP Error [$code]: $response");
        }
        return $response;
    }

    private function read() {
        $response = '';
        while ($str = fgets($this->socket, 515)) {
            $response .= $str;
            if (substr($str, 3, 1) == ' ') break;
        }
        $this->log("S: " . trim($response));
        return $response;
    }
}

// --- Mail Helper Function ---
function send_alert_email($subject, $body, $configOverride = null) {
    global $config, $has_phpmailer;

    $currentConfig = $configOverride ?? $config;

    $to = $currentConfig['alert_email'] ?? '';
    $host = $currentConfig['smtp_host'] ?? '';
    $user = $currentConfig['smtp_user'] ?? '';
    $pass = $currentConfig['smtp_pass'] ?? '';
    $port = intval($currentConfig['smtp_port'] ?? 587);

    // デバッグ用: 値が空の場合は詳細を返す
    if (empty($to) || empty($host) || empty($user)) {
        $debugInfo = json_encode([
            'has_to' => !empty($to),
            'has_host' => !empty($host),
            'has_user' => !empty($user),
            'port' => $port,
            'received_host' => $host // 受信したホスト値をデバッグ出力
        ]);
        return "設定不備: 必須項目が足りません。($debugInfo)";
    }

    // 1. Try PHPMailer (Best)
    if ($has_phpmailer && class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        try {
            $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
            $mail->isSMTP();
            $mail->Host       = $host;
            $mail->SMTPAuth   = true;
            $mail->Username   = $user;
            $mail->Password   = $pass;
            $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            if ($port == 465) {
                $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
            }
            $mail->Port       = $port;
            $mail->CharSet    = 'UTF-8';
            $mail->setFrom($user, 'OmniTools Admin');
            $mail->addAddress($to);
            $mail->isHTML(false);
            $mail->Subject = "[OmniTools] " . $subject;
            $mail->Body    = $body;
            $mail->send();
            return true;
        } catch (\Exception $e) {
            $phpMailerError = $mail->ErrorInfo;
        }
    }

    // 2. Try MinimalSMTP (Fallback)
    try {
        $smtp = new MinimalSMTP($host, $port, $user, $pass);
        $res = $smtp->send($to, $subject, $body);
        if ($res === true) return true;
        $minimalError = $res;
    } catch (\Exception $e) {
        $minimalError = $e->getMessage();
    }

    // 3. Fallback to PHP native mail()
    if (!$configOverride) {
        $sender = 'noreply@' . ($_SERVER['SERVER_NAME'] ?? 'localhost');
        $headers = "From: OmniTools <{$sender}>\r\nReply-To: {$sender}\r\nX-Mailer: PHP/" . phpversion() . "\r\nContent-Type: text/plain; charset=UTF-8";
        if (@mail($to, "[OmniTools] " . $subject, $body, $headers)) {
            return true;
        }
    }

    $msg = 'メール送信失敗:';
    if (isset($phpMailerError)) $msg .= " [PHPMailer: $phpMailerError]";
    if (isset($minimalError)) $msg .= " [SMTP: $minimalError]";
    if (!$has_phpmailer) $msg .= " (PHPMailer未導入)";
    
    return $msg;
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
    
    $attemptsData = array_filter($attemptsData, function($attempt) use ($now, $LOCKOUT_TIME) {
        return ($now - $attempt['time']) < $LOCKOUT_TIME;
    });

    $myAttempts = array_filter($attemptsData, function($attempt) use ($ip) {
        return $attempt['ip'] === $ip;
    });

    if (count($myAttempts) >= $MAX_ATTEMPTS) {
        if (count($myAttempts) === $MAX_ATTEMPTS) {
            $subject = "不正アクセス検知 (Login Lockout)";
            $body = "ログイン試行回数上限超過\nIP: {$ip}\nTime: " . date('Y-m-d H:i:s');
            send_alert_email($subject, $body);
        }
        http_response_code(429);
        echo json_encode(['error' => '試行回数が上限を超えました。15分後に再試行してください。']);
        exit;
    }

    $password = $input['password'] ?? '';
    if (password_verify($password, $config['password_hash'])) {
        $token = bin2hex(random_bytes(16));
        $tokens = load_json($TOKENS_FILE);
        $tokens[$token] = $now + 86400; // 24 hours
        save_json($TOKENS_FILE, $tokens);
        
        // ログイン成功時にアクセスログにも記録
        $logs = load_json($ACCESS_LOG_FILE);
        $log = [
            'timestamp' => time(),
            'date' => date('Y-m-d H:i:s'),
            'ip' => $ip,
            'path' => '[ADMIN LOGIN]',
            'ua' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
            'referer' => '',
            'status' => 200,
            'response_time' => 0
        ];
        array_unshift($logs, $log);
        if (count($logs) > 5000) $logs = array_slice($logs, 0, 5000);
        save_json($ACCESS_LOG_FILE, $logs);

        // ログイン試行履歴をクリア
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
$token = $headers['X-Admin-Token'] ?? $headers['x-admin-token'] ?? $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';

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

    $safeConfig = [
        'smtp_host' => $config['smtp_host'] ?? '',
        'smtp_port' => $config['smtp_port'] ?? 587,
        'smtp_user' => $config['smtp_user'] ?? '',
        'alert_email' => $config['alert_email'] ?? ''
    ];

    echo json_encode([
        'messages' => $messages,
        'stats' => $stats,
        'config' => $safeConfig,
        'has_phpmailer' => $has_phpmailer // フロントエンドに状態を通知
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
    // 値の更新 (trimを追加して空白を除去)
    if (isset($input['smtp_host'])) $config['smtp_host'] = trim($input['smtp_host']);
    if (isset($input['smtp_port'])) $config['smtp_port'] = intval($input['smtp_port']);
    if (isset($input['smtp_user'])) $config['smtp_user'] = trim($input['smtp_user']);
    if (isset($input['alert_email'])) $config['alert_email'] = trim($input['alert_email']);
    
    if (!empty($input['smtp_pass'])) {
        $config['smtp_pass'] = $input['smtp_pass'];
    }

    // ファイル書き込みチェック
    $writeResult = file_put_contents($CONFIG_FILE, json_encode($config, JSON_PRETTY_PRINT));
    $writeError = ($writeResult === false) ? " (Config Save Failed: Permission Denied)" : "";

    // 更新した設定を使ってテスト送信
    $testResult = send_alert_email("Test Mail", "SMTP設定のテストメールです。\n正しく設定されています。", $config);
    
    if ($testResult === true) {
        echo json_encode(['status' => 'success', 'message' => '設定を保存し、テストメールを送信しました' . $writeError]);
    } else {
        echo json_encode(['status' => 'warning', 'message' => '設定は保存されましたが、テスト送信に失敗しました: ' . $testResult . $writeError]);
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