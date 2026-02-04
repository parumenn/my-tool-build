<?php
// Simple Blog API
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// データ保存先を backend/data/blog に変更 (デプロイ時の上書き防止のため)
$DATA_DIR = __DIR__ . '/../backend/data/blog';
$POSTS_FILE = $DATA_DIR . '/posts.json';

// Initialize
if (!file_exists($DATA_DIR)) {
    // 再帰的にディレクトリ作成
    if (!mkdir($DATA_DIR, 0777, true) && !is_dir($DATA_DIR)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create data directory']);
        exit;
    }
    // 直接アクセス禁止
    file_put_contents($DATA_DIR . '/.htaccess', "Order Deny,Allow\nDeny from all");
}

// 初期データの作成
if (!file_exists($POSTS_FILE)) {
    file_put_contents($POSTS_FILE, json_encode([
        [
            'id' => 'init-1',
            'title' => '回春者ブログへようこそ',
            'content' => 'これは最初の投稿です。管理画面から編集・削除できます。このデータは永続化領域に保存されています。',
            'date' => date('Y-m-d H:i:s'),
            'tags' => ['お知らせ']
        ]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

function getPosts() {
    global $POSTS_FILE;
    if (!file_exists($POSTS_FILE)) return [];
    return json_decode(file_get_contents($POSTS_FILE), true) ?: [];
}

function savePosts($posts) {
    global $POSTS_FILE;
    file_put_contents($POSTS_FILE, json_encode($posts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

// Actions
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'list') {
        echo json_encode(getPosts());
    } elseif ($action === 'detail') {
        $id = $_GET['id'] ?? '';
        $posts = getPosts();
        $post = null;
        foreach($posts as $p) { if($p['id'] === $id) { $post = $p; break; } }
        echo json_encode($post ?: ['error' => 'Not found']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($action === 'login') {
        $pass = $input['password'] ?? '';
        if ($pass === 'admin') { // Hardcoded simple password
            echo json_encode(['status' => 'ok', 'token' => 'admin-token-' . time()]);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid password']);
        }
    } elseif ($action === 'save') {
        $posts = getPosts();
        $newPost = [
            'id' => !empty($input['id']) ? $input['id'] : uniqid(),
            'title' => $input['title'] ?? '無題',
            'content' => $input['content'] ?? '',
            'date' => !empty($input['date']) ? $input['date'] : date('Y-m-d H:i:s'),
            'tags' => !empty($input['tags']) ? $input['tags'] : []
        ];
        
        $exists = false;
        foreach($posts as &$p) {
            if ($p['id'] === $newPost['id']) {
                $p = $newPost;
                $exists = true;
                break;
            }
        }
        if (!$exists) array_unshift($posts, $newPost);
        
        savePosts($posts);
        echo json_encode(['status' => 'ok', 'id' => $newPost['id']]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = $_GET['id'] ?? '';
    $posts = getPosts();
    $beforeCount = count($posts);
    $posts = array_values(array_filter($posts, function($p) use ($id) { return $p['id'] !== $id; }));
    
    if (count($posts) !== $beforeCount) {
        savePosts($posts);
    }
    echo json_encode(['status' => 'ok']);
}
?>