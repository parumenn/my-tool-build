
<?php
// security.php
// 共通セキュリティロジック（IPブロック、DOS検知）

// 共通設定
date_default_timezone_set('Asia/Tokyo');
$DATA_DIR = __DIR__ . '/data';

if (!file_exists($DATA_DIR)) {
    if (!mkdir($DATA_DIR, 0777, true) && !is_dir($DATA_DIR)) {
        // 作成失敗時はサイレントに続行
    }
    @file_put_contents($DATA_DIR . '/.htaccess', "Order Deny,Allow\nDeny from all");
}

// ファイルパス定義
$MESSAGES_FILE    = $DATA_DIR . '/messages.json';
$ACCESS_LOG_FILE  = $DATA_DIR . '/access_log.json';
$CONFIG_FILE      = $DATA_DIR . '/admin_config.json';
$BLOCKED_IPS_FILE = $DATA_DIR . '/blocked_ips.json';
$REQ_TRACK_FILE   = $DATA_DIR . '/request_track.json';
$TOKENS_FILE      = $DATA_DIR . '/active_tokens.json';

// ヘルパー関数
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

// Polyfill for getallheaders
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

// --- Minimal SMTP Class (Shared) ---
if (!class_exists('MinimalSMTP')) {
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
                $headers .= "From: OmniTools System <{$this->user}>\r\n";
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
}

/**
 * セキュリティチェックを実行する
 * @param bool $is_api APIモードならJSONレスポンス、そうでなければHTMLメッセージ
 * @return array コンテキストデータ
 */
function run_security_check($is_api = false) {
    global $DATA_DIR, $CONFIG_FILE, $BLOCKED_IPS_FILE, $REQ_TRACK_FILE, $TOKENS_FILE;
    
    $now = time();
    $ip = get_client_ip();

    // Config読み込み
    $default_config = [
        'password_hash' => password_hash('admin123', PASSWORD_DEFAULT),
        'smtp_host' => '', 'smtp_port' => 587, 'smtp_user' => '', 'smtp_pass' => '', 'alert_email' => '',
        'dos_patterns' => [['count' => 30, 'seconds' => 30, 'block_minutes' => 15]],
        'dos_notify_enabled' => true
    ];
    if (!file_exists($CONFIG_FILE)) save_json($CONFIG_FILE, $default_config);
    $config = array_merge($default_config, load_json($CONFIG_FILE));

    // Blocked IP チェック (期限切れは除外して読み込み)
    $blocked = load_json($BLOCKED_IPS_FILE);
    $blocked = array_filter($blocked, function($b) use ($now) { return $b['expiry'] > $now; });

    if (isset($blocked[$ip])) {
        if ($is_api) {
            header("Content-Type: application/json");
            http_response_code(403);
            echo json_encode(['error' => 'IP Blocked']);
        } else {
            http_response_code(403);
            echo "<!DOCTYPE html><html lang='ja'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Access Denied</title></head><body style='font-family:sans-serif;text-align:center;padding:50px;background:#f8f9fa;color:#333;'><h1>403 Access Denied</h1><p>Your IP address (<strong>{$ip}</strong>) has been blocked due to suspicious activity.</p><p style='font-size:0.8em;color:#777;'>セキュリティ保護のため、アクセスが制限されています。</p></body></html>";
        }
        exit;
    }

    // Admin Token チェック (DOS検知の除外に使用)
    $headers = getallheaders();
    $token_header = $headers['X-Admin-Token'] ?? $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';
    $tokens = load_json($TOKENS_FILE);
    // 期限切れトークン掃除
    $tokens = array_filter($tokens, function($expiry) use ($now) { return $expiry > $now; });
    save_json($TOKENS_FILE, $tokens);
    
    $is_admin = isset($tokens[$token_header]) && $tokens[$token_header] > $now;

    // DOS Detection (AdminとOPTIONSメソッドは除外)
    if (!$is_admin && $_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
        $track = load_json($REQ_TRACK_FILE);
        if (!isset($track[$ip])) $track[$ip] = ['times' => []];
        $track[$ip]['times'][] = $now;
        
        // 1時間以上前の履歴は削除
        $track[$ip]['times'] = array_values(array_filter($track[$ip]['times'], function($t) use ($now) { return $t > ($now - 3600); }));
        
        $is_violated = false;
        $violated_pattern = null;
        foreach ($config['dos_patterns'] as $p) {
            $recent = array_filter($track[$ip]['times'], function($t) use ($now, $p) { return $t > ($now - $p['seconds']); });
            if (count($recent) > $p['count']) { 
                $is_violated = true; 
                $violated_pattern = $p;
                break; 
            }
        }
        
        if ($is_violated) {
            $block_min = $violated_pattern['block_minutes'] ?? 15;
            $reason = 'DOS Detect (' . count($recent) . ' reqs in ' . $violated_pattern['seconds'] . 's)';
            $blocked[$ip] = ['expiry' => $now + ($block_min * 60), 'time' => date('Y-m-d H:i:s'), 'reason' => $reason];
            save_json($BLOCKED_IPS_FILE, $blocked);
            
            // 通知
            if ($config['dos_notify_enabled'] && !empty($config['alert_email']) && !empty($config['smtp_host'])) {
                $smtp = new MinimalSMTP($config['smtp_host'], $config['smtp_port'], $config['smtp_user'], $config['smtp_pass']);
                $body = "Security Alert: DOS Detected\n\nIP: {$ip}\nReason: {$reason}\nBlocked for: {$block_min} minutes\nTime: " . date('Y-m-d H:i:s');
                $smtp->send($config['alert_email'], "[OmniTools Security] DOS Blocked", $body);
            }

            if ($is_api) {
                header("Content-Type: application/json");
                http_response_code(429);
                echo json_encode(['error' => 'Too many requests']);
            } else {
                http_response_code(429);
                echo "<!DOCTYPE html><html><head><title>Too Many Requests</title></head><body style='font-family:sans-serif;text-align:center;padding:50px;'><h1>429 Too Many Requests</h1><p>You have sent too many requests in a given amount of time.</p><p>Please wait {$block_min} minutes before trying again.</p></body></html>";
            }
            exit;
        }
        
        // 確率でトラッキングファイルをクリーンアップ（肥大化防止）
        if (rand(1, 100) === 1) {
             foreach ($track as $k => $v) {
                 if (empty($v['times']) || end($v['times']) < ($now - 3600)) unset($track[$k]);
             }
        }
        save_json($REQ_TRACK_FILE, $track);
    }

    // 呼び出し元で使う変数を返す
    return [
        'now' => $now,
        'ip' => $ip,
        'config' => $config,
        'blocked' => $blocked,
        'is_admin' => $is_admin,
        'tokens' => $tokens
    ];
}
?>
