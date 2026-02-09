
<?php
// Simple Blog API with Persistent Config & Image Upload
error_reporting(E_ALL); // 開発中はエラーを表示（本番では0にする）
ini_set('display_errors', 0); // JSONレスポンスを壊さないように画面表示はOFF
ini_set('memory_limit', '512M');
ini_set('post_max_size', '512M');
ini_set('upload_max_filesize', '512M');
ini_set('max_execution_time', 300);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// データ保存先を変更 (Git管理外のディレクトリへ)
$DATA_DIR = __DIR__ . '/database';
$OLD_DATA_DIR = __DIR__ . '/data';

$UPLOADS_DIR = $DATA_DIR . '/uploads';
$POSTS_FILE = $DATA_DIR . '/posts.json';
$CONFIG_FILE = $DATA_DIR . '/config.json';
$FAILURES_FILE = $DATA_DIR . '/login_failures.json';

// .htaccess Content
$HTACCESS_CONTENT = "<IfModule mod_authz_core.c>\n    Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n    Order Deny,Allow\n    Deny from all\n</IfModule>";

// Initialize Directories & Migrate Data
if (!file_exists($DATA_DIR)) {
    if (!mkdir($DATA_DIR, 0777, true) && !is_dir($DATA_DIR)) {
        http_response_code(500); echo json_encode(['error' => 'Failed to create data directory']); exit;
    }
    @file_put_contents($DATA_DIR . '/.htaccess', $HTACCESS_CONTENT);

    // 旧データからの移行処理 (初回のみ)
    if (file_exists($OLD_DATA_DIR)) {
        // JSONファイルのコピー
        foreach (['posts.json', 'config.json', 'login_failures.json'] as $f) {
            if (file_exists("$OLD_DATA_DIR/$f") && !file_exists("$DATA_DIR/$f")) {
                @copy("$OLD_DATA_DIR/$f", "$DATA_DIR/$f");
            }
        }
        // 画像ディレクトリのコピー (簡易版)
        if (file_exists("$OLD_DATA_DIR/uploads") && !file_exists($UPLOADS_DIR)) {
            if (mkdir($UPLOADS_DIR, 0777, true)) {
                $files = glob("$OLD_DATA_DIR/uploads/*");
                foreach ($files as $file) {
                    if (is_file($file)) {
                        @copy($file, "$UPLOADS_DIR/" . basename($file));
                    }
                }
            }
        }
    }
}

if (!file_exists($UPLOADS_DIR)) {
    if (!mkdir($UPLOADS_DIR, 0777, true) && !is_dir($UPLOADS_DIR)) {
        // Silently fail
    }
    @file_put_contents($UPLOADS_DIR . '/.htaccess', $HTACCESS_CONTENT);
}

// Helpers
function getData($file) {
    if (!file_exists($file)) return [];
    $content = file_get_contents($file);
    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}
function saveData($file, $data) {
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}
function getClientIp() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) return $_SERVER['HTTP_CLIENT_IP'];
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) return explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
    return $_SERVER['REMOTE_ADDR'];
}

// ---------------------------------------------------------
// IPブロックチェック
// ---------------------------------------------------------
$ip = getClientIp();
$now = time();

// 安全な外部ファイル読み込み
$is_globally_blocked = false;
$global_reason = '';
$global_blocked_file = __DIR__ . '/../backend/data/blocked_ips.json';

if (file_exists($global_blocked_file)) {
    $global_blocked = getData($global_blocked_file);
    if (isset($global_blocked[$ip]) && $global_blocked[$ip]['expiry'] > $now) {
        $is_globally_blocked = true;
        $global_reason = $global_blocked[$ip]['reason'] ?? 'Unknown';
    }
}

if ($is_globally_blocked) {
    http_response_code(403);
    echo json_encode([
        'error' => "アクセスがブロックされています。",
        'message' => "セキュリティ違反により、このIPからのアクセスは全サイトで制限されています。(Reason: $global_reason)",
        'blocked' => true
    ]);
    exit;
}

// 2. ブログ独自のログイン試行回数チェック
$failures = getData($FAILURES_FILE);
$blockDuration = 30 * 60; // 30分
$maxAttempts = 3;         // 3回失敗でアウト

// Initialize Config & Posts
if (!file_exists($CONFIG_FILE)) {
    $defaultConfig = ['password_hash' => password_hash('admin', PASSWORD_DEFAULT), 'blog_name' => '開発者ブログ'];
    file_put_contents($CONFIG_FILE, json_encode($defaultConfig, JSON_PRETTY_PRINT));
}

if (!file_exists($POSTS_FILE)) {
    file_put_contents($POSTS_FILE, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$action = $_GET['action'] ?? '';
$config = getData($CONFIG_FILE);

// --- Actions ---

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'list') {
        echo json_encode(getData($POSTS_FILE));
    } 
    elseif ($action === 'detail') {
        $id = $_GET['id'] ?? '';
        $posts = getData($POSTS_FILE);
        $post = null;
        foreach($posts as $p) { if($p['id'] === $id) { $post = $p; break; } }
        echo json_encode($post ?: ['error' => 'Not found']);
    } 
    elseif ($action === 'config') {
        echo json_encode(['blog_name' => $config['blog_name'] ?? 'Blog']);
    }
    elseif ($action === 'image') {
        $name = basename($_GET['name'] ?? '');
        $path = $UPLOADS_DIR . '/' . $name;
        if ($name && file_exists($path)) {
            $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
            $mimes = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'gif' => 'image/gif', 'webp' => 'image/webp'];
            $mime = $mimes[$ext] ?? 'application/octet-stream';
            
            while (ob_get_level()) { ob_end_clean(); }
            
            header("Content-Type: $mime");
            header("Content-Length: " . filesize($path));
            header("Cache-Control: public, max-age=86400");
            readfile($path);
            exit;
        } else {
            http_response_code(404); exit;
        }
    }
} 
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if ($action === 'login') {
        $pass = $input['password'] ?? '';
        
        if (!isset($failures[$ip])) {
            $failures[$ip] = ['count' => 0, 'last_attempt' => 0];
        }

        if (password_verify($pass, $config['password_hash'])) {
            unset($failures[$ip]);
            saveData($FAILURES_FILE, $failures);
            echo json_encode(['status' => 'ok', 'token' => 'admin-token-' . time()]);
        } else {
            $failures[$ip]['count']++;
            $failures[$ip]['last_attempt'] = $now;
            saveData($FAILURES_FILE, $failures);

            $attemptsLeft = $maxAttempts - $failures[$ip]['count'];
            
            if ($attemptsLeft <= 0) {
                http_response_code(403);
                echo json_encode(['error' => "ログイン試行回数が上限を超えました。しばらくお待ちください。", 'blocked' => true]);
            } else {
                http_response_code(401); 
                echo json_encode(['error' => "パスワードが違います（あと{$attemptsLeft}回でブロック）"]);
            }
        }
    } 
    elseif ($action === 'save') {
        $posts = getData($POSTS_FILE);
        $newPost = [
            'id' => !empty($input['id']) ? $input['id'] : uniqid(),
            'title' => $input['title'] ?? '無題',
            'content' => $input['content'] ?? '',
            'date' => !empty($input['date']) ? $input['date'] : date('Y-m-d H:i:s'),
            'tags' => !empty($input['tags']) ? $input['tags'] : [],
            'status' => $input['status'] ?? 'published' // draft or published
        ];
        $exists = false;
        foreach($posts as &$p) { if ($p['id'] === $newPost['id']) { $p = $newPost; $exists = true; break; } }
        if (!$exists) array_unshift($posts, $newPost);
        saveData($POSTS_FILE, $posts);
        echo json_encode(['status' => 'ok', 'id' => $newPost['id']]);
    } 
    elseif ($action === 'change_password') {
        if (password_verify($input['current_password'] ?? '', $config['password_hash'])) {
            $config['password_hash'] = password_hash($input['new_password'], PASSWORD_DEFAULT);
            saveData($CONFIG_FILE, $config);
            echo json_encode(['status' => 'ok']);
        } else {
            http_response_code(401); echo json_encode(['error' => '現在のパスワードが間違っています']);
        }
    }
    elseif ($action === 'upload') {
        if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
            $ext = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION));
            if (!in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                http_response_code(400); echo json_encode(['error' => 'Invalid file type']); exit;
            }
            $filename = uniqid('img_') . '.' . $ext;
            if (move_uploaded_file($_FILES['file']['tmp_name'], $UPLOADS_DIR . '/' . $filename)) {
                echo json_encode(['status' => 'ok', 'url' => 'api.php?action=image&name=' . $filename]);
            } else {
                http_response_code(500); echo json_encode(['error' => 'Upload failed']);
            }
        } else {
            http_response_code(400); echo json_encode(['error' => 'No file uploaded']);
        }
    }
} 
elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = $_GET['id'] ?? '';
    $posts = getData($POSTS_FILE);
    $beforeCount = count($posts);
    $posts = array_values(array_filter($posts, function($p) use ($id) { return $p['id'] !== $id; }));
    if (count($posts) !== $beforeCount) saveData($POSTS_FILE, $posts);
    echo json_encode(['status' => 'ok']);
}
