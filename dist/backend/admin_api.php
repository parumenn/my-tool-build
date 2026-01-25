
<?php
// JSONレスポンスを破壊するPHPのエラー出力を抑制
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
ini_set('display_errors', 0);

// 日本時間に設定
date_default_timezone_set('Asia/Tokyo');
$start_time = microtime(true);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Admin-Token");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

// Data Paths
$DATA_DIR = __DIR__ . '/data';
if (!file_exists($DATA_DIR)) mkdir($DATA_DIR, 0777, true);

$MESSAGES_FILE    = $DATA_DIR . '/messages.json';
$ACCESS_LOG_FILE  = $DATA_DIR . '/access_log.json';
$CONFIG_FILE      = $DATA_DIR . '/admin_config.json';
$BLOCKED_IPS_FILE = $DATA_DIR . '/blocked_ips.json';
$REQ_TRACK_FILE   = $DATA_DIR . '/request_track.json';
$TOKENS_FILE      = $DATA_DIR . '/active_tokens.json';

// Helper Functions
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

// SMTP Class for Test & Alerts
class SimpleSMTP {
    private $cfg;
    public function __construct($cfg) { $this->cfg = $cfg; }
    public function send($to, $subject, $body) {
        $host = $this->cfg['smtp_host'];
        $port = $this->cfg['smtp_port'];
        $user = $this->cfg['smtp_user'];
        $pass = $this->cfg['smtp_pass'];
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

// Initialize Config
$config = load_json($CONFIG_FILE);
if (!isset($config['password_hash'])) {
    $config = [
        'password_hash' => password_hash('admin123', PASSWORD_DEFAULT),
        'smtp_host' => '', 'smtp_port' => 587, 'smtp_user' => '', 'smtp_pass' => '', 'alert_email' => '',
        'dos_patterns' => [
            ['count' => 30, 'seconds' => 30, 'block_minutes' => 15]
        ],
        'dos_notify_enabled' => true
    ];
    save_json($CONFIG_FILE, $config);
}

// --- DOS Protection Logic ---
$ip = get_client_ip();
$now = time();
$blocked = load_json($BLOCKED_IPS_FILE);

// 期限切れブロックの解除 (永久BAN 2147483647 は除外)
$blocked = array_filter($blocked, function($b) use ($now) { 
    return $b['expiry'] > $now; 
});

if (isset($blocked[$ip])) {
    $is_permanent = ($blocked[$ip]['expiry'] >= 2147483640);
    http_response_code(403);
    $msg = $is_permanent ? 'アクセスが永久に制限されています。' : '一時的にアクセスを制限しています。残り: ' . ceil(($blocked[$ip]['expiry'] - $now) / 60) . '分';
    echo json_encode(['error' => $msg]);
    exit;
}

// リクエスト追跡 (管理画面のAPIは除外)
$action = $_GET['action'] ?? '';
if ($action !== 'fetch_dashboard' && $action !== 'update_settings' && $action !== 'test_email') {
    $track = load_json($REQ_TRACK_FILE);
    if (!isset($track[$ip])) $track[$ip] = ['times' => []];
    
    $track[$ip]['times'][] = $now;
    
    // 設定された全パターンをチェック
    $patterns = $config['dos_patterns'] ?? [['count' => 30, 'seconds' => 30, 'block_minutes' => 15]];
    $is_violated = false;
    $applied_pattern = null;

    foreach ($patterns as $p) {
        $limit_sec = $p['seconds'];
        $limit_count = $p['count'];
        
        // 期間内のアクセスをフィルタリング
        $recent_hits = array_filter($track[$ip]['times'], function($t) use ($now, $limit_sec) { 
            return $t > ($now - $limit_sec); 
        });
        
        if (count($recent_hits) > $limit_count) {
            $is_violated = true;
            $applied_pattern = $p;
            break; // 最初の違反で止める
        }
    }

    if ($is_violated) {
        $minutes = $applied_pattern['block_minutes'];
        $expiry = ($minutes === 0) ? 2147483647 : ($now + ($minutes * 60));
        
        $blocked[$ip] = [
            'expiry' => $expiry,
            'time' => date('Y-m-d H:i:s'),
            'reason' => "DOS検知 ({$applied_pattern['count']}回/{$applied_pattern['seconds']}秒)",
            'permanent' => ($minutes === 0)
        ];
        save_json($BLOCKED_IPS_FILE, $blocked);
        
        if ($config['dos_notify_enabled'] && !empty($config['alert_email'])) {
            $smtp = new SimpleSMTP($config);
            $p_text = ($minutes === 0) ? "永久" : "{$minutes}分間";
            $smtp->send($config['alert_email'], "【セキュリティ警告】IP遮断通知", "過剰アクセスを検知しIPを遮断しました。\n\nIP: {$ip}\n理由: {$applied_pattern['count']}回以上のリクエスト（{$applied_pattern['seconds']}秒間）\n期間: {$p_text}");
        }
        
        http_response_code(429);
        echo json_encode(['error' => '過剰なリクエストを検知したため、アクセスを一時制限しました。']);
        exit;
    }
    
    // 古い記録をクリーンアップして保存
    $max_window = 300; // 最大5分前の記録まで保持
    $track[$ip]['times'] = array_filter($track[$ip]['times'], function($t) use ($now, $max_window) { 
        return $t > ($now - $max_window); 
    });
    save_json($REQ_TRACK_FILE, $track);
}

// --- API Router ---
$input = json_decode(file_get_contents('php://input'), true);

if ($action === 'login') {
    if (password_verify($input['password'] ?? '', $config['password_hash'])) {
        $token = bin2hex(random_bytes(16));
        $tokens = load_json($TOKENS_FILE);
        $tokens[$token] = $now + 86400;
        save_json($TOKENS_FILE, $tokens);
        echo json_encode(['token' => $token]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'パスワードが違います']);
    }
    exit;
}

if ($action === 'log_access') {
    $logs = load_json($ACCESS_LOG_FILE);
    array_unshift($logs, [
        'timestamp' => microtime(true), 
        'date' => date('Y-m-d H:i:s'), 
        'ip' => $ip, 
        'path' => $input['path'] ?? '/', 
        'ua' => $_SERVER['HTTP_USER_AGENT'], 
        'status' => $input['status'] ?? 200,
        'duration' => $input['duration'] ?? 0 // 所要時間を保存
    ]);
    save_json($ACCESS_LOG_FILE, array_slice($logs, 0, 5000));
    echo json_encode(['status' => 'ok']);
    exit;
}

if ($action === 'send') {
    $msgs = load_json($MESSAGES_FILE);
    array_unshift($msgs, ['id' => uniqid(), 'timestamp' => date('Y-m-d H:i:s'), 'ip' => $ip, 'name' => $input['name'] ?? '匿名', 'contact' => $input['contact'] ?? '', 'message' => htmlspecialchars($input['message'])]);
    save_json($MESSAGES_FILE, $msgs);
    echo json_encode(['status' => 'ok']);
    exit;
}

// Admin Check
$token = getallheaders()['X-Admin-Token'] ?? '';
$tokens = load_json($TOKENS_FILE);
if (!isset($tokens[$token]) || $tokens[$token] < $now) {
    http_response_code(403);
    exit;
}

if ($action === 'fetch_dashboard') {
    echo json_encode([
        'stats' => ['total_pv' => count(load_json($ACCESS_LOG_FILE)), 'today_pv' => count(array_filter(load_json($ACCESS_LOG_FILE), function($l){return $l['timestamp'] > strtotime('today midnight');})), 'recent_logs' => array_slice(load_json($ACCESS_LOG_FILE), 0, 500)],
        'messages' => load_json($MESSAGES_FILE),
        'blocked_ips' => $blocked,
        'config' => [
            'smtp_host' => $config['smtp_host'], 'smtp_port' => $config['smtp_port'], 'smtp_user' => $config['smtp_user'], 'alert_email' => $config['alert_email'],
            'dos_patterns' => $config['dos_patterns'] ?? [['count' => 30, 'seconds' => 30, 'block_minutes' => 15]],
            'dos_notify_enabled' => $config['dos_notify_enabled']
        ]
    ]);
} elseif ($action === 'update_settings') {
    foreach($input as $k => $v) {
        if ($k === 'smtp_pass' && empty($v)) continue;
        $config[$k] = $v;
    }
    save_json($CONFIG_FILE, $config);
    echo json_encode(['status' => '成功']);
} elseif ($action === 'test_email') {
    $test_cfg = array_merge($config, $input);
    $smtp = new SimpleSMTP($test_cfg);
    $res = $smtp->send($test_cfg['alert_email'], "まいつーる: メール接続テスト", "このメールが届いていれば、SMTP設定は正しく機能しています。\n送信日時: " . date('Y-m-d H:i:s'));
    echo json_encode($res === true ? ['status' => '成功'] : ['status' => 'エラー', 'error' => $res]);
} elseif ($action === 'unblock_ip') {
    unset($blocked[$input['ip']]);
    save_json($BLOCKED_IPS_FILE, $blocked);
    echo json_encode(['status' => 'ok']);
} elseif ($action === 'import_data') {
    if (isset($input['messages'])) save_json($MESSAGES_FILE, $input['messages']);
    if (isset($input['logs'])) save_json($ACCESS_LOG_FILE, $input['logs']);
    echo json_encode(['status' => '成功']);
}
?>
