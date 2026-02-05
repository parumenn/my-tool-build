
<?php
// Simple Blog API with Persistent Config & Image Upload
// リソース制限の緩和
ini_set('memory_limit', '512M');
ini_set('post_max_size', '512M');
ini_set('upload_max_filesize', '512M');
ini_set('max_execution_time', 300);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// データ保存先 (デプロイで消えない領域)
$DATA_DIR = __DIR__ . '/../backend/data/blog';
$UPLOADS_DIR = $DATA_DIR . '/uploads';
$POSTS_FILE = $DATA_DIR . '/posts.json';
$CONFIG_FILE = $DATA_DIR . '/config.json';
$FAILURES_FILE = $DATA_DIR . '/login_failures.json'; // ログイン失敗記録用

// Initialize Directories
if (!file_exists($DATA_DIR)) {
    if (!mkdir($DATA_DIR, 0777, true) && !is_dir($DATA_DIR)) {
        http_response_code(500); echo json_encode(['error' => 'Failed to create data directory']); exit;
    }
    @file_put_contents($DATA_DIR . '/.htaccess', "Order Deny,Allow\nDeny from all");
}
if (!file_exists($UPLOADS_DIR)) {
    if (!mkdir($UPLOADS_DIR, 0777, true) && !is_dir($UPLOADS_DIR)) {
        http_response_code(500); echo json_encode(['error' => 'Failed to create uploads directory']); exit;
    }
    // Uploads directory needs to be protected from direct script execution but we will serve images via PHP
    @file_put_contents($UPLOADS_DIR . '/.htaccess', "Order Deny,Allow\nDeny from all");
}

// Initialize Config
if (!file_exists($CONFIG_FILE)) {
    $defaultConfig = ['password_hash' => password_hash('admin', PASSWORD_DEFAULT), 'blog_name' => '開発者ブログ'];
    file_put_contents($CONFIG_FILE, json_encode($defaultConfig, JSON_PRETTY_PRINT));
}

// Initialize Posts
if (!file_exists($POSTS_FILE)) {
    file_put_contents($POSTS_FILE, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Helpers
function getData($file) {
    if (!file_exists($file)) return [];
    return json_decode(file_get_contents($file), true) ?: [];
}
function saveData($file, $data) {
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}
function getClientIp() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) return $_SERVER['HTTP_CLIENT_IP'];
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) return explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
    return $_SERVER['REMOTE_ADDR'];
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
        // Serve image from protected directory
        $name = basename($_GET['name'] ?? '');
        $path = $UPLOADS_DIR . '/' . $name;
        if ($name && file_exists($path)) {
            $mime = mime_content_type($path);
            header("Content-Type: $mime");
            header("Content-Length: " . filesize($path));
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
        $ip = getClientIp();
        $failures = getData($FAILURES_FILE);
        $now = time();
        $blockDuration = 30 * 60; // 30分間ブロック
        $maxAttempts = 3; // 最大試行回数

        // ブロックチェック
        if (isset($failures[$ip])) {
            $record = $failures[$ip];
            // 試行回数を超過し、かつブロック期間内の場合
            if ($record['count'] >= $maxAttempts && ($now - $record['last_attempt']) < $blockDuration) {
                http_response_code(403);
                $remaining = ceil(($blockDuration - ($now - $record['last_attempt'])) / 60);
                echo json_encode(['error' => "ログイン試行回数が上限を超えました。あと{$remaining}分間ブロックされます。"]);
                exit;
            }
            // ブロック期間を過ぎていればリセット
            if (($now - $record['last_attempt']) >= $blockDuration) {
                unset($failures[$ip]);
            }
        }

        $pass = $input['password'] ?? '';
        if (password_verify($pass, $config['password_hash'])) {
            // 成功したら失敗記録を削除
            if (isset($failures[$ip])) {
                unset($failures[$ip]);
                saveData($FAILURES_FILE, $failures);
            }
            echo json_encode(['status' => 'ok', 'token' => 'admin-token-' . time()]);
        } else {
            // 失敗したらカウント
            if (!isset($failures[$ip])) {
                $failures[$ip] = ['count' => 0, 'last_attempt' => 0];
            }
            $failures[$ip]['count']++;
            $failures[$ip]['last_attempt'] = $now;
            saveData($FAILURES_FILE, $failures);

            $attemptsLeft = $maxAttempts - $failures[$ip]['count'];
            $msg = $attemptsLeft > 0 
                ? "パスワードが違います（あと{$attemptsLeft}回でブロック）" 
                : "パスワードが違います。IPアドレスを一時的にブロックしました。";
            
            http_response_code(401); 
            echo json_encode(['error' => $msg]);
        }
    } 
    elseif ($action === 'save') {
        $posts = getData($POSTS_FILE);
        $newPost = [
            'id' => !empty($input['id']) ? $input['id'] : uniqid(),
            'title' => $input['title'] ?? '無題',
            'content' => $input['content'] ?? '',
            'date' => !empty($input['date']) ? $input['date'] : date('Y-m-d H:i:s'),
            'tags' => !empty($input['tags']) ? $input['tags'] : []
        ];
        $exists = false;
        foreach($posts as &$p) {
            if ($p['id'] === $newPost['id']) { $p = $newPost; $exists = true; break; }
        }
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
                // Return the URL that calls this API with action=image
                $url = 'api.php?action=image&name=' . $filename;
                echo json_encode(['status' => 'ok', 'url' => $url]);
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
?>
