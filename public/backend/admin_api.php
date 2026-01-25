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

// getallheaders Polyfill
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

// Composer
$has_phpmailer = false;
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
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
$BLOCKED_IPS_FILE = $DATA_DIR . '/blocked_ips.json';
$REQ_TRACK_FILE  = $DATA_DIR . '/request_track.json';

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

// Utility functions
function get_client_ip() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) return $_SERVER['HTTP_CLIENT_IP'];
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) return explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
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

/** Minimal SMTP Client **/
class MinimalSMTP {
    private $host; private $port; private $user; private $pass; private $socket; private $timeout = 10; public $debugLog = [];
    public function __construct($host, $port, $user, $pass) { $this->host = $host; $this->port = $port; $this->user = $user; $this->pass = $pass; }
    private function log($msg) { $this->debugLog[] = $msg; }
    public function send($to, $subject, $body, $fromName = 'まいつーる 管理') {
        try {
            $protocol = ($this->port == 465) ? 'ssl://' : '';
            $this->socket = @fsockopen($protocol . $this->host, $this->port, $errno, $errstr, $this->timeout);
            if (!$this->socket) return "接続失敗: $errstr";
            $this->read(); $this->cmd('EHLO ' . ($_SERVER['SERVER_NAME'] ?? 'localhost'));
            if ($this->port == 587) {
                $this->cmd('STARTTLS');
                stream_socket_enable_crypto($this->socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                $this->cmd('EHLO ' . ($_SERVER['SERVER_NAME'] ?? 'localhost'));
            }
            $this->cmd('AUTH LOGIN'); $this->cmd(base64_encode($this->user)); $this->cmd(base64_encode($this->pass));
            $this->cmd("MAIL FROM: <{$this->user}>"); $this->cmd("RCPT TO: <$to>"); $this->cmd('DATA');
            $headers = "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nFrom: =?UTF-8?B?".base64_encode($fromName)."?= <{$this->user}>\r\nTo: <$to>\r\nSubject: =?UTF-8?B?".base64_encode($subject)."?=\r\nDate: ".date("r")."\r\n";
            $this->cmd($headers . "\r\n" . $body . "\r\n."); $this->cmd('QUIT'); fclose($this->socket); return true;
        } catch (Exception $e) { return $e->getMessage(); }
    }
    private function cmd($c) { fputs($this->socket, $c . "\r\n"); return $this->read(); }
    private function read() { $r = ''; while ($s = fgets($this->socket, 515)) { $r .= $s; if (substr($s, 3, 1) == ' ') break; } return $r; }
}

function send_alert_email($subject, $body, $configOverride = null) {
    global $config, $has_phpmailer;
    $currentConfig = $configOverride ?? $config;
    $to = $currentConfig['alert_email'] ?? '';
    if (empty($to)) return "アラート用メールアドレスが未設定です";
    if ($has_phpmailer) {
        try {
            $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
            $mail->isSMTP(); $mail->Host = $currentConfig['smtp_host']; $mail->SMTPAuth = true;
            $mail->Username = $currentConfig['smtp_user']; $mail->Password = $currentConfig['smtp_pass'];
            $mail->SMTPSecure = ($currentConfig['smtp_port'] == 465) ? 'ssl' : 'tls';
            $mail->Port = $currentConfig['smtp_port']; $mail->CharSet = 'UTF-8';
            $mail->setFrom($currentConfig['smtp_user'], 'まいつーる セキュリティ');
            $mail->addAddress($to); $mail->Subject = "[まいつーる] " . $subject; $mail->Body = $body;
            $mail->send(); return true;
        } catch (Exception $e) { return $mail->ErrorInfo; }
    }
    $smtp = new MinimalSMTP($currentConfig['smtp_host'], $currentConfig['smtp_port'], $currentConfig['smtp_user'], $currentConfig['smtp_pass']);
    return $smtp->send($to, $subject, $body);
}

// --- DOS保護 & IP遮断チェック ---
$current_ip = get_client_ip();
$blocked_ips = load_json($BLOCKED_IPS_FILE);

// 1. IPが遮断されているかチェック
if (isset($blocked_ips[$current_ip])) {
    http_response_code(403);
    // ログ記録
    if ($_GET['action'] !== 'log_access') {
        $logs = load_json($ACCESS_LOG_FILE);
        $mtime = microtime(true);
        $ts = (int)$mtime;
        $ms = sprintf("%03d", ($mtime - $ts) * 1000);
        $date_with_ms = date('Y-m-d H:i:s', $ts) . '.' . $ms;
        
        array_unshift($logs, [
            'timestamp' => $mtime, 
            'date' => $date_with_ms, 
            'ip' => $current_ip, 
            'path' => '[拒否されたアクセス: '.$_GET['action'].']', 
            'ua' => $_SERVER['HTTP_USER_AGENT'], 
            'status' => 403
        ]);
        save_json($ACCESS_LOG_FILE, array_slice($logs, 0, 5000));
    }
    echo json_encode(['error' => 'セキュリティ上の理由により、お使いのIPアドレスからのアクセスは制限されています。']);
    exit;
}

// 2. レートリミット (DOS検知)
$MAX_REQ_PER_MINUTE = 60;
$track = load_json($REQ_TRACK_FILE);
$now = time();
$minute_ago = $now - 60;

// 古いトラッキングデータの削除
$track = array_filter($track, function($reqs) use ($minute_ago) { 
    return array_filter($reqs, function($ts) use ($minute_ago) { return $ts > $minute_ago; });
});

if (!isset($track[$current_ip])) $track[$current_ip] = [];
$track[$current_ip][] = $now;
$req_count = count($track[$current_ip]);

if ($req_count > $MAX_REQ_PER_MINUTE) {
    // IP遮断
    $blocked_ips[$current_ip] = ['reason' => 'DOS攻撃（過剰なリクエスト）を検知', 'time' => date('Y-m-d H:i:s'), 'timestamp' => $now];
    save_json($BLOCKED_IPS_FILE, $blocked_ips);
    
    // 管理者へのメール通知
    $subject = "セキュリティアラート: IPを自動遮断しました (DOS保護)";
    $body = "過剰なリクエスト送信が検知されたため、以下のIPアドレスをサイト全体で遮断しました。\n\n対象IP: {$current_ip}\nアクセス頻度: {$req_count} リクエスト/分\n遮断日時: " . date('Y-m-d H:i:s') . "\n\n管理パネルから解除可能です。";
    send_alert_email($subject, $body);
    
    http_response_code(429);
    echo json_encode(['error' => 'リクエストが多すぎます。セキュリティ保護のためIPアドレスが遮断されました。']);
    exit;
}
save_json($REQ_TRACK_FILE, $track);

// --- API アクション ---
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

if ($action === 'log_access') {
    $mtime = microtime(true);
    $ts = (int)$mtime;
    $ms = sprintf("%03d", ($mtime - $ts) * 1000);
    $date_with_ms = date('Y-m-d H:i:s', $ts) . '.' . $ms;

    $log = [
        'timestamp' => $mtime, 
        'date' => $date_with_ms, 
        'ip' => $current_ip, 
        'path' => $input['path'] ?? '/', 
        'ua' => $_SERVER['HTTP_USER_AGENT'] ?? '不明なブラウザ', 
        'referer' => $input['referer'] ?? '', 
        'status' => $input['status'] ?? 200, 
        'response_time' => round((microtime(true) - $start_time) * 1000, 3) 
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
    array_unshift($messages, ['id' => uniqid(), 'timestamp' => date('Y-m-d H:i:s'), 'ip' => $current_ip, 'name' => $input['name'] ?? '匿名ユーザー', 'contact' => $input['contact'] ?? '', 'message' => htmlspecialchars($input['message'])]);
    save_json($MESSAGES_FILE, $messages);
    echo json_encode(['status' => '成功']);
    exit;
}

if ($action === 'login') {
    $attemptsData = load_json($ATTEMPTS_FILE);
    $attemptsData = array_filter($attemptsData, function($a) use ($now) { return ($now - $a['time']) < 900; });
    if (count(array_filter($attemptsData, function($a) use ($current_ip) { return $a['ip'] === $current_ip; })) >= 5) {
        http_response_code(429); echo json_encode(['error' => 'ログイン試行回数が多すぎます。15分後に再度お試しください。']); exit;
    }
    if (password_verify($input['password'] ?? '', $config['password_hash'])) {
        $token = bin2hex(random_bytes(16));
        $tokens = load_json($TOKENS_FILE);
        $tokens[$token] = $now + 86400;
        save_json($TOKENS_FILE, $tokens);
        echo json_encode(['token' => $token]);
    } else {
        $attemptsData[] = ['ip' => $current_ip, 'time' => $now];
        save_json($ATTEMPTS_FILE, $attemptsData);
        http_response_code(401); echo json_encode(['error' => 'パスワードが正しくありません']);
    }
    exit;
}

// 管理者専用ルート
$headers = getallheaders();
$token = $headers['X-Admin-Token'] ?? $headers['x-admin-token'] ?? $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';
$tokens = load_json($TOKENS_FILE);
if (!isset($tokens[$token]) || $tokens[$token] < $now) {
    http_response_code(403); echo json_encode(['error' => 'セッションが無効です。再度ログインしてください。']); exit;
}

if ($action === 'fetch_dashboard') {
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
        'blocked_count' => count($blocked_ips)
    ]);
} elseif ($action === 'fetch_security') {
    echo json_encode(['blocked_ips' => $blocked_ips]);
} elseif ($action === 'unblock_ip') {
    $ip_to_unblock = $input['ip'] ?? '';
    if (isset($blocked_ips[$ip_to_unblock])) {
        unset($blocked_ips[$ip_to_unblock]);
        save_json($BLOCKED_IPS_FILE, $blocked_ips);
        echo json_encode(['status' => '成功']);
    } else {
        http_response_code(404); echo json_encode(['error' => '対象のIPアドレスが見つかりませんでした']);
    }
} elseif ($action === 'update_smtp') {
    // 既存設定をベースに更新
    $config['smtp_host'] = trim($input['smtp_host'] ?? $config['smtp_host']); 
    $config['smtp_port'] = intval($input['smtp_port'] ?? $config['smtp_port']);
    $config['smtp_user'] = trim($input['smtp_user'] ?? $config['smtp_user']); 
    $config['alert_email'] = trim($input['alert_email'] ?? $config['alert_email']);
    if (!empty($input['smtp_pass'])) {
        $config['smtp_pass'] = $input['smtp_pass'];
    }
    save_json($CONFIG_FILE, $config);
    $res = send_alert_email("通知設定テスト", "アラート通知設定が正しく更新されました。", $config);
    echo json_encode($res === true ? ['status' => '成功'] : ['status' => 'エラー', 'message' => $res]);
} elseif ($action === 'import_data') {
    // データの一括インポート (管理者権限)
    if (!isset($input['messages']) || !isset($input['logs']) || !isset($input['config'])) {
        http_response_code(400); echo json_encode(['error' => '無効なデータ形式です']); exit;
    }
    
    // 受信メッセージとログを上書き (件数制限なし)
    save_json($MESSAGES_FILE, $input['messages']);
    save_json($ACCESS_LOG_FILE, $input['logs']);
    
    // 設定を一部更新 (ハッシュは上書きしない)
    $importConfig = $input['config'];
    $config['smtp_host'] = $importConfig['smtp_host'] ?? $config['smtp_host'];
    $config['smtp_port'] = $importConfig['smtp_port'] ?? $config['smtp_port'];
    $config['smtp_user'] = $importConfig['smtp_user'] ?? $config['smtp_user'];
    if (!empty($importConfig['smtp_pass'])) $config['smtp_pass'] = $importConfig['smtp_pass'];
    $config['alert_email'] = $importConfig['alert_email'] ?? $config['alert_email'];
    save_json($CONFIG_FILE, $config);

    echo json_encode(['status' => '成功']);
} elseif ($action === 'change_password') {
    if (!password_verify($input['current_password'], $config['password_hash'])) {
        http_response_code(400); echo json_encode(['error' => '現在のパスワードが一致しません']); exit;
    }
    $config['password_hash'] = password_hash($input['new_password'], PASSWORD_DEFAULT);
    save_json($CONFIG_FILE, $config);
    echo json_encode(['status' => '成功']);
}
?>