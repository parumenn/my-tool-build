
<?php
ob_start();
error_reporting(0);
ini_set('display_errors', 0);

date_default_timezone_set('Asia/Tokyo');
$now = time();

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Admin-Token");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    exit(0);
}

// Directory Setup
// シンボリックリンクにより、このパスはサーバー上の永続化ディレクトリを参照します
$DATA_DIR = __DIR__ . '/data';

// 万が一リンクが切れていた場合のフォールバック（ディレクトリ作成）
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

// --- Minimal SMTP Class ---
class MinimalSMTP {
    private $host; private $port; private $user; private $pass;
    private $socket;

    public function __construct($host, $port, $user, $pass) {
        $this->host = $host; $this->port = $port; $this->user = $user; $this->pass = $pass;
    }

    private function cmd($cmd, $expect = [250]) {
        fputs($this->socket, $cmd . "\r\n");
        $res = $this->read();
        $code = (int)substr($res, 0, 3);
        if (!in_array($code, $expect) && !empty($expect)) {
            throw new Exception("SMTP Error [$code]: $res");
        }
        return $res;
    }

    private function read() {
        $s = '';
        while($str = fgets($this->socket, 515)) {
            $s .= $str;
            if(substr($str, 3, 1) == ' ') break;
        }
        return $s;
    }

    public function send($to, $subject, $body) {
        try {
            $ctx = stream_context_create(['ssl' => ['verify_peer' => false, 'verify_peer_name' => false]]);
            $protocol = ($this->port == 465) ? 'ssl://' : '';
            $this->socket = @stream_socket_client($protocol . $this->host . ':' . $this->port, $errno, $errstr, 10, STREAM_CLIENT_CONNECT, $ctx);
            if (!$this->socket) throw new Exception("Connection failed: $errstr");

            $this->read(); 
            $this->cmd("EHLO " . $_SERVER['SERVER_NAME']);
            
            if ($this->port == 587) {
                $this->cmd("STARTTLS", [220]);
                stream_socket_enable_crypto($this->socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                $this->cmd("EHLO " . $_SERVER['SERVER_NAME']);
            }

            $this->cmd("AUTH LOGIN", [334]);
            $this->cmd(base64_encode($this->user), [334]);
            $this->cmd(base64_encode($this->pass), [235]);

            $this->cmd("MAIL FROM: <{$this->user}>");
            $this->cmd("RCPT TO: <$to>");
            $this->cmd("DATA", [354]);

            $headers  = "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
            $headers .= "From: OmniTools Admin <{$this->user}>\r\n";
            $headers .= "To: <$to>\r\n";
            $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
            $headers .= "Date: " . date("r") . "\r\n";

            $this->cmd($headers . "\r\n" . $body . "\r\n.", [250]);
            $this->cmd("QUIT", [221]);
            fclose($this->socket);
            return true;
        } catch (Exception $e) {
            if ($this->socket) fclose($this->socket);
            return $e->getMessage();
        }
    }
}

// --- Helpers ---
function load_json($file) {
    if (!file_exists($file)) return [];
    $content = file_get_contents($file);
    return json_decode($content, true) ?: [];
}
function save_json($file, $data) {
    file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
}
function get_client_ip() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) return $_SERVER['HTTP_CLIENT_IP'];
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) return explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
    return $_SERVER['REMOTE_ADDR'];
}

function get_server_stats() {
    $stats = ['cpu' => 0, 'mem' => ['total' => 0, 'used' => 0, 'percent' => 0], 'disk' => ['total' => 0, 'used' => 0, 'percent' => 0]];

    // --- Memory (Linux /proc/meminfo) ---
    if (@is_readable('/proc/meminfo')) {
        $meminfo = file_get_contents('/proc/meminfo');
        $total = 0; $avail = 0;
        if (preg_match('/MemTotal:\s+(\d+)/', $meminfo, $matches)) $total = $matches[1] * 1024;
        if (preg_match('/MemAvailable:\s+(\d+)/', $meminfo, $matches)) $avail = $matches[1] * 1024;
        
        if ($total > 0) {
            $used = $total - $avail;
            $stats['mem'] = [
                'total' => $total,
                'used' => $used,
                'percent' => round(($used / $total) * 100, 1)
            ];
        }
    }

    // --- CPU (Linux /proc/stat) ---
    if (@is_readable('/proc/stat')) {
        // 1回目の取得
        $stat1 = file_get_contents('/proc/stat');
        usleep(100000); // 0.1秒待機
        // 2回目の取得
        $stat2 = file_get_contents('/proc/stat');

        $get_cpu_info = function($source) {
            if (preg_match('/^cpu\s+(.*)/m', $source, $matches)) {
                $parts = preg_split('/\s+/', trim($matches[1]));
                // user + nice + system + idle + iowait + irq + softirq + steal
                $total_time = array_sum($parts);
                $idle_time = $parts[3]; 
                return ['total' => $total_time, 'idle' => $idle_time];
            }
            return null;
        };

        $info1 = $get_cpu_info($stat1);
        $info2 = $get_cpu_info($stat2);

        if ($info1 && $info2) {
            $total_delta = $info2['total'] - $info1['total'];
            $idle_delta = $info2['idle'] - $info1['idle'];
            if ($total_delta > 0) {
                $usage = ($total_delta - $idle_delta) / $total_delta;
                $stats['cpu'] = round($usage * 100, 1);
            }
        }
    } else {
        // Fallback (ロードアベレージ)
        $load = sys_getloadavg();
        if ($load) $stats['cpu'] = min(100, round($load[0] * 10)); 
    }

    // --- Disk ---
    $disk_total = @disk_total_space('.');
    $disk_free = @disk_free_space('.');
    if ($disk_total !== false) {
        $stats['disk']['total'] = $disk_total; 
        $stats['disk']['used'] = $disk_total - $disk_free;
        $stats['disk']['percent'] = round(($stats['disk']['used'] / $disk_total) * 100, 1);
    }
    
    return $stats;
}

// Polyfill for getallheaders() if not exists (Nginx etc.)
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

// --- Init Config ---
$default_config = [
    'password_hash' => password_hash('admin123', PASSWORD_DEFAULT),
    'smtp_host' => '', 'smtp_port' => 587, 'smtp_user' => '', 'smtp_pass' => '', 'alert_email' => '',
    'dos_patterns' => [['count' => 30, 'seconds' => 30, 'block_minutes' => 15]],
    'dos_notify_enabled' => true
];
if (!file_exists($CONFIG_FILE)) save_json($CONFIG_FILE, $default_config);
$config = array_merge($default_config, load_json($CONFIG_FILE));

$ip = get_client_ip();
$blocked = load_json($BLOCKED_IPS_FILE);
$blocked = array_filter($blocked, function($b) use ($now) { return $b['expiry'] > $now; });

if (isset($blocked[$ip])) {
    ob_clean(); http_response_code(403); echo json_encode(['error' => 'IP Blocked']); exit;
}

// Token Check (Robust)
$headers = getallheaders();
$token_header = $headers['X-Admin-Token'] ?? $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';
$tokens = load_json($TOKENS_FILE);
$is_admin = isset($tokens[$token_header]) && $tokens[$token_header] > $now;

// --- DOS Detection (Skip for admin) ---
if (!$is_admin && $_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    $track = load_json($REQ_TRACK_FILE);
    if (!isset($track[$ip])) $track[$ip] = ['times' => []];
    $track[$ip]['times'][] = $now;
    $track[$ip]['times'] = array_values(array_filter($track[$ip]['times'], function($t) use ($now) { return $t > ($now - 3600); }));
    
    $is_violated = false;
    foreach ($config['dos_patterns'] as $p) {
        $recent = array_filter($track[$ip]['times'], function($t) use ($now, $p) { return $t > ($now - $p['seconds']); });
        if (count($recent) > $p['count']) { $is_violated = true; break; }
    }
    
    if ($is_violated) {
        $blocked[$ip] = ['expiry' => $now + 900, 'time' => date('Y-m-d H:i:s'), 'reason' => 'DOS Detect'];
        save_json($BLOCKED_IPS_FILE, $blocked);
        save_json($REQ_TRACK_FILE, $track);
        ob_clean(); http_response_code(429); echo json_encode(['error' => 'Too many requests']); exit;
    }
    save_json($REQ_TRACK_FILE, $track);
}

// --- Action Router ---
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);
$response = ['status' => 'error'];

if ($action === 'login') {
    if (password_verify($input['password'] ?? '', $config['password_hash'])) {
        $token = bin2hex(random_bytes(16));
        $tokens[$token] = $now + 86400;
        save_json($TOKENS_FILE, $tokens);
        $response = ['token' => $token];
    } else {
        http_response_code(401); $response = ['error' => 'Invalid password'];
    }
} 
elseif ($action === 'log_access') {
    $logs = load_json($ACCESS_LOG_FILE);
    array_unshift($logs, ['timestamp' => microtime(true), 'date' => date('Y-m-d H:i:s'), 'ip' => $ip, 'path' => $input['path'] ?? '/', 'status' => $input['status'] ?? 200]);
    save_json($ACCESS_LOG_FILE, array_slice($logs, 0, 1000));
    $response = ['status' => 'ok'];
}
elseif ($action === 'send') {
    // Contact Form
    $msgs = load_json($MESSAGES_FILE);
    $msgs[] = [
        'id' => uniqid(), 'timestamp' => date('Y-m-d H:i:s'), 'ip' => $ip,
        'name' => $input['name']??'NoName', 'contact' => $input['contact']??'', 'message' => $input['message']??''
    ];
    save_json($MESSAGES_FILE, $msgs);
    
    // Notification
    if (!empty($config['alert_email']) && !empty($config['smtp_host'])) {
        $smtp = new MinimalSMTP($config['smtp_host'], $config['smtp_port'], $config['smtp_user'], $config['smtp_pass']);
        $smtp->send($config['alert_email'], "Contact from " . ($input['name']??'User'), $input['message']??'');
    }
    $response = ['status' => 'ok'];
}
// --- Admin Only Actions ---
elseif ($is_admin) {
    if ($action === 'fetch_dashboard') {
        $logs = load_json($ACCESS_LOG_FILE);
        $today = date('Y-m-d');
        $today_pv = count(array_filter($logs, function($l) use ($today) { return strpos($l['date'], $today) === 0; }));
        $response = [
            'stats' => ['total_pv' => count($logs), 'today_pv' => $today_pv, 'recent_logs' => array_slice($logs, 0, 200)], 
            'blocked_ips' => $blocked,
            'messages' => load_json($MESSAGES_FILE),
            'server_resources' => get_server_stats(),
            'config' => [
                'smtp_host' => $config['smtp_host'], 'smtp_port' => $config['smtp_port'],
                'smtp_user' => $config['smtp_user'], 'alert_email' => $config['alert_email'],
                'dos_patterns' => $config['dos_patterns'], 'dos_notify_enabled' => $config['dos_notify_enabled']
            ]
        ];
    }
    elseif ($action === 'update_settings') {
        if (!empty($input['new_password'])) {
            $config['password_hash'] = password_hash($input['new_password'], PASSWORD_DEFAULT);
        }
        foreach(['smtp_host', 'smtp_port', 'smtp_user', 'alert_email', 'dos_patterns', 'dos_notify_enabled'] as $k) {
            if (isset($input[$k])) $config[$k] = $input[$k];
        }
        if (!empty($input['smtp_pass'])) $config['smtp_pass'] = $input['smtp_pass'];
        
        save_json($CONFIG_FILE, $config);
        $response = ['status' => 'ok'];
    }
    elseif ($action === 'test_email') {
        $smtp = new MinimalSMTP($input['smtp_host'], $input['smtp_port'], $input['smtp_user'], $input['smtp_pass'] ?: $config['smtp_pass']);
        $res = $smtp->send($input['alert_email'], "OmniTools SMTP Test", "これはSMTP設定のテストメールです。\n正常に送信されました。");
        if ($res === true) $response = ['status' => '成功'];
        else { http_response_code(400); $response = ['status' => 'error', 'error' => $res]; }
    }
    elseif ($action === 'unblock_ip') {
        if (isset($blocked[$input['ip']])) {
            unset($blocked[$input['ip']]);
            save_json($BLOCKED_IPS_FILE, $blocked);
        }
        $response = ['status' => 'ok'];
    }
    elseif ($action === 'import_data') {
        if (isset($input['messages'])) save_json($MESSAGES_FILE, $input['messages']);
        if (isset($input['logs'])) save_json($ACCESS_LOG_FILE, $input['logs']);
        $response = ['status' => 'ok'];
    }
} else {
    if ($action !== 'log_access' && $action !== 'login' && $action !== 'send') {
        http_response_code(403); $response = ['error' => 'Unauthorized'];
    }
}

ob_clean();
echo json_encode($response);
exit;
?>
