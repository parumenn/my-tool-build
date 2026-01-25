<?php
/**
 * Admin API for OmniTools
 * - Supports Data Persistence with File Locking
 * - Real-time DOS Protection
 * - Admin Password Management
 */

// エラー出力を抑制してJSONを保護
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
ini_set('display_errors', 0);

date_default_timezone_set('Asia/Tokyo');
$now = time();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Admin-Token");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

// Data Paths
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

// Helper Functions with LOCK_EX for persistence
function load_json($file) {
    if (!file_exists($file)) return [];
    $content = file_get_contents($file);
    return json_decode($content, true) ?: [];
}
function save_json($file, $data) {
    // LOCK_EX を使用して、同時書き込みによるファイル破損（データ消失）を防止
    file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
}
function get_client_ip() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) return $_SERVER['HTTP_CLIENT_IP'];
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) return explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
    return $_SERVER['REMOTE_ADDR'];
}

// SMTP Class
class SimpleSMTP {
    private $cfg;
    public function __construct($cfg) { $this->cfg = $cfg; }
    public function send($to, $subject, $body) {
        $host = $this->cfg['smtp_host'] ?? '';
        $port = $this->cfg['smtp_port'] ?? 587;
        $user = $this->cfg['smtp_user'] ?? '';
        $pass = $this->cfg['smtp_pass'] ?? '';
        if (empty($host) || empty($user)) return "SMTP設定が不完全です。";
        try {
            $protocol = ($port == 465) ? 'ssl://' : '';
            $socket = @fsockopen($protocol . $host, $port, $errno, $errstr, 5);
            if (!$socket) return "接続失敗: $errstr ($errno)";
            $this->read($socket);
            $this->cmd($socket, "EHLO localhost");
            if ($port == 587) {
                $this->cmd($socket, "STARTTLS");
                stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                $this->cmd($socket, "EHLO localhost");
            }
            $this->cmd($socket, "AUTH LOGIN");
            $this->cmd($socket, base64_encode($user));
            $this->cmd($socket, base64_encode($pass));
            $this->cmd($socket, "MAIL FROM: <$user>");
            $this->cmd($socket, "RCPT TO: <$to>");
            $this->cmd($socket, "DATA");
            $headers = "From: <$user>\r\nTo: <$to>\r\nSubject: =?UTF-8?B?".base64_encode($subject)."?=\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n";
            $this->cmd($socket, $headers . $body . "\r\n.");
            $this->cmd($socket, "QUIT");
            fclose($socket);
            return true;
        } catch (Exception $e) { return $e->getMessage(); }
    }
    private function cmd($s, $c) { fputs($s, $c . "\r\n"); return $this->read($s); }
    private function read($s) { $r = ""; while($l = fgets($s, 512)) { $r .= $l; if(substr($l, 3, 1) == " ") break; } return $r; }
}

// 1. Initial Data Loading
$default_config = [
    'password_hash' => password_hash('admin123', PASSWORD_DEFAULT),
    'smtp_host' => '', 'smtp_port' => 587, 'smtp_user' => '', 'smtp_pass' => '', 'alert_email' => '',
    'dos_patterns' => [['count' => 30, 'seconds' => 30, 'block_minutes' => 15]],
    'dos_notify_enabled' => true
];
$saved_config = load_json($CONFIG_FILE);
$config = array_merge($default_config, $saved_config);

$ip = get_client_ip();
$blocked = load_json($BLOCKED_IPS_FILE);
$blocked = array_filter($blocked, function($b) use ($now) { return $b['expiry'] > $now; });

// 既にブロックされている場合は即遮断
if (isset($blocked[$ip])) {
    http_response_code(403);
    echo json_encode(['error' => 'Your IP is temporarily blocked due to security reasons.']);
    exit;
}

// 2. Global Request Tracking for DOS Protection (MUST be early)
$token_header = getallheaders()['X-Admin-Token'] ?? '';
$tokens = load_json($TOKENS_FILE);
$is_admin = isset($tokens[$token_header]) && $tokens[$token_header] > $now;

if (!$is_admin) {
    $track = load_json($REQ_TRACK_FILE);
    if (!isset($track[$ip])) $track[$ip] = ['times' => []];
    $track[$ip]['times'][] = $now;
    
    // 直近1時間の記録のみ保持
    $track[$ip]['times'] = array_values(array_filter($track[$ip]['times'], function($t) use ($now) { 
        return $t > ($now - 3600); 
    }));
    
    $is_violated = false;
    $v_pattern = null;
    foreach ($config['dos_patterns'] as $p) {
        $recent_hits = array_filter($track[$ip]['times'], function($t) use ($now, $p) { 
            return $t > ($now - $p['seconds']); 
        });
        if (count($recent_hits) > $p['count']) {
            $is_violated = true;
            $v_pattern = $p;
            break;
        }
    }

    if ($is_violated) {
        $expiry = ($v_pattern['block_minutes'] === 0) ? 2147483647 : ($now + ($v_pattern['block_minutes'] * 60));
        $blocked[$ip] = [
            'expiry' => $expiry,
            'time' => date('Y-m-d H:i:s'),
            'reason' => "自動検知: {$v_pattern['count']}回/{$v_pattern['seconds']}秒のリクエスト",
        ];
        save_json($BLOCKED_IPS_FILE, $blocked);
        
        if ($config['dos_notify_enabled'] && !empty($config['alert_email'])) {
            $smtp = new SimpleSMTP($config);
            $smtp->send($config['alert_email'], "【セキュリティ警報】IP遮断通知", "IP: $ip を自動遮断しました。\n理由: リクエスト頻度の超過\n解除予定: " . ($v_pattern['block_minutes'] === 0 ? '永久' : date('Y-m-d H:i:s', $expiry)));
        }
        http_response_code(429);
        echo json_encode(['error' => 'Too many requests. IP has been blocked.']);
        exit;
    }
    save_json($REQ_TRACK_FILE, $track);
}

// 3. API Actions
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

if ($action === 'login') {
    if (password_verify($input['password'] ?? '', $config['password_hash'])) {
        $token = bin2hex(random_bytes(16));
        $tokens[$token] = $now + 86400; // 24h
        save_json($TOKENS_FILE, $tokens);
        echo json_encode(['token' => $token]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'パスワードが正しくありません']);
    }
    exit;
}

if ($action === 'log_access') {
    $logs = load_json($ACCESS_LOG_FILE);
    array_unshift($logs, [
        'timestamp' => microtime(true), 'date' => date('Y-m-d H:i:s'), 'ip' => $ip, 
        'path' => $input['path'] ?? '/', 'ua' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown', 
        'status' => $input['status'] ?? 200, 'duration' => $input['duration'] ?? 0
    ]);
    save_json($ACCESS_LOG_FILE, array_slice($logs, 0, 5000));
    echo json_encode(['status' => 'ok']);
    exit;
}

if ($action === 'send') {
    $msgs = load_json($MESSAGES_FILE);
    array_unshift($msgs, [
        'id' => uniqid(), 'timestamp' => date('Y-m-d H:i:s'), 'ip' => $ip, 
        'name' => $input['name'] ?? '匿名', 'contact' => $input['contact'] ?? '', 
        'message' => htmlspecialchars($input['message'] ?? '')
    ]);
    save_json($MESSAGES_FILE, $msgs);
    echo json_encode(['status' => 'ok']);
    exit;
}

// Admin Authenticated Actions
if (!$is_admin) { http_response_code(403); exit; }

if ($action === 'fetch_dashboard') {
    $raw_logs = load_json($ACCESS_LOG_FILE);
    echo json_encode([
        'stats' => [
            'total_pv' => count($raw_logs), 
            'today_pv' => count(array_filter($raw_logs, function($l){return strtotime($l['date']) > strtotime('today midnight');})), 
            'recent_logs' => array_slice($raw_logs, 0, 500)
        ],
        'messages' => load_json($MESSAGES_FILE),
        'blocked_ips' => $blocked,
        'config' => [
            'smtp_host' => $config['smtp_host'], 'smtp_port' => $config['smtp_port'], 
            'smtp_user' => $config['smtp_user'], 'alert_email' => $config['alert_email'],
            'dos_patterns' => $config['dos_patterns'], 'dos_notify_enabled' => $config['dos_notify_enabled']
        ]
    ]);
} elseif ($action === 'update_settings') {
    foreach($input as $k => $v) {
        if ($k === 'smtp_pass' && empty($v)) continue;
        if ($k === 'new_password' && !empty($v)) {
            $config['password_hash'] = password_hash($v, PASSWORD_DEFAULT);
            continue;
        }
        $config[$k] = $v;
    }
    save_json($CONFIG_FILE, $config);
    echo json_encode(['status' => '成功']);
} elseif ($action === 'test_email') {
    $test_cfg = array_merge($config, $input);
    $smtp = new SimpleSMTP($test_cfg);
    $target = $test_cfg['alert_email'] ?: $test_cfg['smtp_user'];
    $res = $smtp->send($target, "まいつーる: メール接続テスト", "管理者様\n\nSMTP設定のテストメールです。このメールが届いている場合、通知設定は正しく行われています。\n\n送信時刻: " . date('Y-m-d H:i:s'));
    echo json_encode($res === true ? ['status' => '成功'] : ['status' => 'エラー', 'error' => $res]);
} elseif ($action === 'unblock_ip') {
    if (isset($blocked[$input['ip']])) {
        unset($blocked[$input['ip']]);
        save_json($BLOCKED_IPS_FILE, $blocked);
    }
    echo json_encode(['status' => 'ok']);
} elseif ($action === 'import_data') {
    if (isset($input['messages'])) save_json($MESSAGES_FILE, $input['messages']);
    if (isset($input['logs'])) save_json($ACCESS_LOG_FILE, $input['logs']);
    echo json_encode(['status' => '成功']);
}
?>