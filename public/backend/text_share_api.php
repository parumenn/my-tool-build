<?php
/**
 * TextShare API
 * テキストデータの保存、取得、自動削除を行います。
 */

// 大容量テキスト（最大1GB）を許容する設定
// ※ サーバーのphp.ini設定が優先される場合があります
ini_set('memory_limit', '1024M');
ini_set('post_max_size', '1024M');
ini_set('upload_max_filesize', '1024M');
ini_set('max_execution_time', 300);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// データ保存ディレクトリ
$DATA_DIR = __DIR__ . '/data/text_share';

// ディレクトリ作成と保護
if (!file_exists($DATA_DIR)) {
    if (!mkdir($DATA_DIR, 0777, true) && !is_dir($DATA_DIR)) {
        http_response_code(500);
        echo json_encode(['error' => 'Storage directory creation failed']);
        exit;
    }
    // ディレクトリリスティング防止
    @file_put_contents($DATA_DIR . '/.htaccess', "Order Deny,Allow\nDeny from all");
}

$action = $_GET['action'] ?? '';

/**
 * ガベージコレクション (期限切れファイルの削除)
 * アクセスがあるたびに 10% の確率で実行
 */
function cleanup_expired_files($dir) {
    if (rand(1, 10) !== 1) return;
    
    $now = time();
    $files = glob($dir . '/*.json');
    foreach ($files as $file) {
        $content = json_decode(file_get_contents($file), true);
        if (!$content || !isset($content['expires_at']) || $content['expires_at'] < $now) {
            @unlink($file);
        }
    }
}

// --- Action: Save Text ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'save') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['text'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Text content is empty']);
        exit;
    }

    // 期間設定 (デフォルト2日, 最大7日)
    $days = isset($input['days']) ? intval($input['days']) : 2;
    if ($days < 1) $days = 1;
    if ($days > 7) $days = 7;

    // ID生成 (ランダム16文字)
    $id = bin2hex(random_bytes(8));
    $filename = $DATA_DIR . '/' . $id . '.json';
    
    // データ構築
    $data = [
        'id' => $id,
        'text' => $input['text'],
        'created_at' => time(),
        'expires_at' => time() + ($days * 86400)
    ];

    if (file_put_contents($filename, json_encode($data, JSON_UNESCAPED_UNICODE))) {
        // 保存成功時にGC実行のチャンス
        cleanup_expired_files($DATA_DIR);
        
        echo json_encode([
            'status' => 'success',
            'id' => $id,
            'expires_at' => date('Y-m-d H:i:s', $data['expires_at'])
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save file']);
    }
    exit;
}

// --- Action: Get Text ---
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get') {
    $id = $_GET['id'] ?? '';
    
    // IDのバリデーション (英数字のみ)
    if (!preg_match('/^[a-f0-9]{16}$/', $id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid ID format']);
        exit;
    }

    $filename = $DATA_DIR . '/' . $id . '.json';

    if (file_exists($filename)) {
        $content = json_decode(file_get_contents($filename), true);
        
        // 期限チェック
        if ($content['expires_at'] < time()) {
            // 期限切れなら削除して404
            @unlink($filename);
            http_response_code(404);
            echo json_encode(['error' => 'Expired']);
        } else {
            echo json_encode([
                'text' => $content['text'],
                'created_at' => date('Y-m-d H:i:s', $content['created_at']),
                'expires_at' => date('Y-m-d H:i:s', $content['expires_at'])
            ]);
        }
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Not Found']);
    }
    exit;
}

// Default
http_response_code(400);
echo json_encode(['error' => 'Invalid action']);
?>