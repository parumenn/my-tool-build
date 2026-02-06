<?php
/**
 * URL Bundler API
 * 複数のURLをJSONとして保存し、IDを発行する
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// データ保存ディレクトリ
$DATA_DIR = __DIR__ . '/data/url_bundles';

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

// --- Action: Save Bundle ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'save') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['urls']) || !is_array($input['urls'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid URLs data']);
        exit;
    }

    // URLのバリデーションとフィルタリング
    $validUrls = [];
    foreach ($input['urls'] as $url) {
        $url = trim($url);
        // http/httpsがない場合、https://を付与して検証
        if (!preg_match('#^https?://#i', $url)) {
            $url = 'https://' . $url;
        }
        
        if (filter_var($url, FILTER_VALIDATE_URL)) {
            $validUrls[] = $url;
        }
    }

    if (empty($validUrls)) {
        http_response_code(400);
        echo json_encode(['error' => 'No valid URLs provided']);
        exit;
    }

    // ID生成 (ランダム8文字)
    $id = bin2hex(random_bytes(4));
    $filename = $DATA_DIR . '/' . $id . '.json';
    
    // 保存期間設定 (デフォルト365日, 最大365日)
    $expireDays = isset($input['expire_days']) ? intval($input['expire_days']) : 365;
    if ($expireDays < 1) $expireDays = 1;
    if ($expireDays > 365) $expireDays = 365;
    
    $expireSeconds = $expireDays * 24 * 60 * 60;

    // データ構築
    $data = [
        'id' => $id,
        'title' => $input['title'] ?? 'URLまとめ',
        'urls' => $validUrls,
        'auto_redirect' => !empty($input['auto_redirect']), // 自動リダイレクト設定
        'created_at' => time(),
        'expires_at' => time() + $expireSeconds
    ];

    if (file_put_contents($filename, json_encode($data, JSON_UNESCAPED_UNICODE))) {
        echo json_encode([
            'status' => 'success',
            'id' => $id,
            'count' => count($validUrls),
            'expires_at' => date('Y-m-d H:i:s', $data['expires_at'])
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save file']);
    }
    exit;
}

// --- Action: Get Bundle ---
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get') {
    $id = $_GET['id'] ?? '';
    
    // IDのバリデーション (英数字のみ)
    if (!preg_match('/^[a-f0-9]{8}$/', $id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid ID format']);
        exit;
    }

    $filename = $DATA_DIR . '/' . $id . '.json';

    if (file_exists($filename)) {
        $content = json_decode(file_get_contents($filename), true);
        
        // 期限切れチェック
        if (isset($content['expires_at']) && $content['expires_at'] < time()) {
            @unlink($filename);
            http_response_code(404);
            echo json_encode(['error' => 'Expired']);
            exit;
        }

        echo json_encode($content);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Not Found']);
    }
    exit;
}

// --- Action: Delete Bundle ---
if (($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'DELETE') && $action === 'delete') {
    // POST body または GETパラメータからIDを取得
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? $_GET['id'] ?? '';

    // IDのバリデーション
    if (!preg_match('/^[a-f0-9]{8}$/', $id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid ID format']);
        exit;
    }

    $filename = $DATA_DIR . '/' . $id . '.json';

    if (file_exists($filename)) {
        if (@unlink($filename)) {
            echo json_encode(['status' => 'success', 'message' => 'Deleted']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete']);
        }
    } else {
        // 既に無い場合は成功とみなす（冪等性）
        echo json_encode(['status' => 'success', 'message' => 'Already deleted or not found']);
    }
    exit;
}

// Default
http_response_code(400);
echo json_encode(['error' => 'Invalid action']);
?>