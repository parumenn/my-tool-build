
<?php
// admin_api.php
// セキュリティチェックロジックを security.php に委譲

require_once __DIR__ . '/security.php';

// APIモードでセキュリティチェック実行
$ctx = run_security_check(true);

// コンテキスト変数を展開
$now = $ctx['now'];
$ip = $ctx['ip'];
$config = $ctx['config'];
$blocked = $ctx['blocked'];
$is_admin = $ctx['is_admin'];
$tokens = $ctx['tokens'];

// ログイン失敗記録用のファイル (ブログとは別に管理)
$FAILURES_FILE = $DATA_DIR . '/admin_login_failures.json';

// 出力バッファリング開始（security.php以前の出力防止のため再度確認）
if (ob_get_length()) ob_clean();

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
// get_server_stats は API 固有のためここに定義
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
        $stat1 = file_get_contents('/proc/stat');
        usleep(100000); // 0.1s
        $stat2 = file_get_contents('/proc/stat');

        $get_cpu_info = function($source) {
            if (preg_match('/^cpu\s+(.*)/m', $source, $matches)) {
                $parts = preg_split('/\s+/', trim($matches[1]));
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

// --- Action Router ---
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);
$response = ['status' => 'error'];

if ($action === 'login') {
    $failures = load_json($FAILURES_FILE);
    $maxAttempts = 3;
    $blockDuration = 30 * 60; // 30分

    // 既にブロックされているかは security.php で弾かれるが、
    // ここでも念の為、過去の失敗履歴を確認
    if (isset($failures[$ip])) {
        // 30分以上経過していればリセット
        if (($now - $failures[$ip]['last_attempt']) >= $blockDuration) {
            unset($failures[$ip]);
            save_json($FAILURES_FILE, $failures);
        }
    }

    if (password_verify($input['password'] ?? '', $config['password_hash'])) {
        // ログイン成功 -> 失敗記録をリセット
        if (isset($failures[$ip])) {
            unset($failures[$ip]);
            save_json($FAILURES_FILE, $failures);
        }

        $token = bin2hex(random_bytes(16));
        $tokens[$token] = $now + 86400;
        save_json($GLOBALS['TOKENS_FILE'], $tokens);
        $response = ['token' => $token];
    } else {
        // ログイン失敗
        if (!isset($failures[$ip])) {
            $failures[$ip] = ['count' => 0, 'last_attempt' => 0];
        }
        $failures[$ip]['count']++;
        $failures[$ip]['last_attempt'] = $now;
        
        $attemptsLeft = $maxAttempts - $failures[$ip]['count'];

        if ($attemptsLeft <= 0) {
            // 3回失敗 -> ブロックリストに追加
            $blocked = load_json($GLOBALS['BLOCKED_IPS_FILE']);
            $blocked[$ip] = [
                'expiry' => $now + $blockDuration,
                'time' => date('Y-m-d H:i:s'),
                'reason' => 'Main Admin Login Failed (3 attempts)'
            ];
            save_json($GLOBALS['BLOCKED_IPS_FILE'], $blocked);
            
            // 失敗記録はリセット（次回解除後用）
            unset($failures[$ip]);
            save_json($FAILURES_FILE, $failures);

            http_response_code(403);
            $response = ['error' => 'ログイン試行回数が上限を超えました。IPアドレスを一時的にブロックしました。'];
        } else {
            save_json($FAILURES_FILE, $failures);
            http_response_code(401); 
            $response = ['error' => "パスワードが違います（あと{$attemptsLeft}回でブロック）"];
        }
    }
} 
elseif ($action === 'log_access') {
    $logs = load_json($GLOBALS['ACCESS_LOG_FILE']);
    array_unshift($logs, ['timestamp' => microtime(true), 'date' => date('Y-m-d H:i:s'), 'ip' => $ip, 'path' => $input['path'] ?? '/', 'status' => $input['status'] ?? 200]);
    save_json($GLOBALS['ACCESS_LOG_FILE'], array_slice($logs, 0, 1000));
    $response = ['status' => 'ok'];
}
elseif ($action === 'send') {
    $msgs = load_json($GLOBALS['MESSAGES_FILE']);
    $msgs[] = [
        'id' => uniqid(), 'timestamp' => date('Y-m-d H:i:s'), 'ip' => $ip,
        'name' => $input['name']??'NoName', 'contact' => $input['contact']??'', 'message' => $input['message']??''
    ];
    save_json($GLOBALS['MESSAGES_FILE'], $msgs);
    
    if (!empty($config['alert_email']) && !empty($config['smtp_host'])) {
        $smtp = new MinimalSMTP($config['smtp_host'], $config['smtp_port'], $config['smtp_user'], $config['smtp_pass']);
        $smtp->send($config['alert_email'], "Contact from " . ($input['name']??'User'), $input['message']??'');
    }
    $response = ['status' => 'ok'];
}
// --- Admin Only Actions ---
elseif ($is_admin) {
    if ($action === 'fetch_dashboard') {
        $logs = load_json($GLOBALS['ACCESS_LOG_FILE']);
        $today = date('Y-m-d');
        $today_pv = count(array_filter($logs, function($l) use ($today) { return strpos($l['date'], $today) === 0; }));
        $response = [
            'stats' => ['total_pv' => count($logs), 'today_pv' => $today_pv, 'recent_logs' => array_slice($logs, 0, 200)], 
            'blocked_ips' => $blocked,
            'messages' => load_json($GLOBALS['MESSAGES_FILE']),
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
        
        save_json($GLOBALS['CONFIG_FILE'], $config);
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
            save_json($GLOBALS['BLOCKED_IPS_FILE'], $blocked);
        }
        $response = ['status' => 'ok'];
    }
    elseif ($action === 'import_data') {
        if (isset($input['messages'])) save_json($GLOBALS['MESSAGES_FILE'], $input['messages']);
        if (isset($input['logs'])) save_json($GLOBALS['ACCESS_LOG_FILE'], $input['logs']);
        $response = ['status' => 'ok'];
    }
} else {
    if ($action !== 'log_access' && $action !== 'login' && $action !== 'send') {
        http_response_code(403); $response = ['error' => 'Unauthorized'];
    }
}

// JSON出力
header("Content-Type: application/json; charset=UTF-8");
echo json_encode($response);
exit;
?>
