<?php
/**
 * Schedule API
 * 日程調整・出欠確認用API
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// データ保存ディレクトリ
$DATA_DIR = __DIR__ . '/data/schedules';

// ディレクトリ作成と保護
if (!file_exists($DATA_DIR)) {
    if (!mkdir($DATA_DIR, 0777, true) && !is_dir($DATA_DIR)) {
        http_response_code(500);
        echo json_encode(['error' => 'Storage directory creation failed']);
        exit;
    }
    @file_put_contents($DATA_DIR . '/.htaccess', "Order Deny,Allow\nDeny from all");
}

$action = $_GET['action'] ?? '';

// --- Action: Create Event ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'create') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['title']) || empty($input['polls'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid data']);
        exit;
    }

    $id = bin2hex(random_bytes(8));
    $adminToken = bin2hex(random_bytes(16));
    $filename = $DATA_DIR . '/' . $id . '.json';
    
    $data = [
        'id' => $id,
        'admin_token' => $adminToken,
        'title' => $input['title'],
        'description' => $input['description'] ?? '',
        'deadline' => $input['deadline'] ?? null,
        'polls' => $input['polls'], // [{id, title, candidates:[]}]
        'answers' => [],
        'created_at' => time(),
        'updated_at' => time()
    ];

    if (file_put_contents($filename, json_encode($data, JSON_UNESCAPED_UNICODE))) {
        echo json_encode([
            'status' => 'success',
            'id' => $id,
            'admin_token' => $adminToken
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save file']);
    }
    exit;
}

// --- Action: Get Event ---
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get') {
    $id = $_GET['id'] ?? '';
    if (!preg_match('/^[a-f0-9]{16}$/', $id)) {
        http_response_code(400); echo json_encode(['error' => 'Invalid ID']); exit;
    }

    $filename = $DATA_DIR . '/' . $id . '.json';
    if (file_exists($filename)) {
        $data = json_decode(file_get_contents($filename), true);
        // 管理者トークンは、閲覧時には隠す（編集権限確認は別途行う）
        // クライアント側で token param がある場合のみ照合に使用するが、
        // GETレスポンスには含めないのが安全。
        // ただし簡易実装のため、admin_tokenは除外して返す。
        // 編集・削除時にtokenをPOSTさせる。
        unset($data['admin_token']);
        echo json_encode($data);
    } else {
        http_response_code(404); echo json_encode(['error' => 'Not Found']);
    }
    exit;
}

// --- Action: Add/Update Answer ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'answer') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['event_id'] ?? '';
    
    if (!preg_match('/^[a-f0-9]{16}$/', $id)) {
        http_response_code(400); echo json_encode(['error' => 'Invalid ID']); exit;
    }

    $filename = $DATA_DIR . '/' . $id . '.json';
    if (!file_exists($filename)) {
        http_response_code(404); echo json_encode(['error' => 'Not Found']); exit;
    }

    // ファイルロック機構（簡易）
    $fp = fopen($filename, 'r+');
    if (flock($fp, LOCK_EX)) {
        $content = fread($fp, filesize($filename));
        $data = json_decode($content, true);
        
        $newAnswer = [
            'id' => $input['answer_id'] ?? uniqid(),
            'name' => $input['name'],
            'selections' => $input['selections'], // { pollId: [{status: 2, comment: ""}, ...] }
            'comment' => $input['comment'] ?? '',
            'timestamp' => time()
        ];

        // 既存の回答があれば更新、なければ追加
        $exists = false;
        foreach ($data['answers'] as &$ans) {
            if ($ans['id'] === $newAnswer['id']) {
                $ans = $newAnswer;
                $exists = true;
                break;
            }
        }
        if (!$exists) {
            $data['answers'][] = $newAnswer;
        }
        $data['updated_at'] = time();

        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($data, JSON_UNESCAPED_UNICODE));
        flock($fp, LOCK_UN);
        fclose($fp);
        
        echo json_encode(['status' => 'success', 'data' => $data]);
    } else {
        http_response_code(503); echo json_encode(['error' => 'Busy']);
    }
    exit;
}

// --- Action: Delete Event (Admin Only) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'delete') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? '';
    $token = $input['token'] ?? '';

    $filename = $DATA_DIR . '/' . $id . '.json';
    if (file_exists($filename)) {
        $data = json_decode(file_get_contents($filename), true);
        if (($data['admin_token'] ?? '') === $token) {
            unlink($filename);
            echo json_encode(['status' => 'success']);
        } else {
            http_response_code(403); echo json_encode(['error' => 'Invalid Token']);
        }
    } else {
        http_response_code(404); echo json_encode(['error' => 'Not Found']);
    }
    exit;
}

?>