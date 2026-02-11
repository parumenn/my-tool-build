
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

    // パスワードが設定されている場合ハッシュ化して保存
    if (!empty($input['password'])) {
        $data['password_hash'] = password_hash($input['password'], PASSWORD_DEFAULT);
    }

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
        
        // パスワード保護の有無をクライアントに通知
        $data['has_password'] = !empty($data['password_hash']);
        
        // センシティブな情報は削除して返す
        unset($data['admin_token']);
        unset($data['password_hash']);
        
        echo json_encode($data);
    } else {
        http_response_code(404); echo json_encode(['error' => 'Not Found']);
    }
    exit;
}

// --- Action: Auth (幹事ログイン) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'auth') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? '';
    $password = $input['password'] ?? '';

    $filename = $DATA_DIR . '/' . $id . '.json';
    if (file_exists($filename)) {
        $data = json_decode(file_get_contents($filename), true);
        
        // パスワードが設定されていない場合、誰でも管理者になれる
        if (empty($data['password_hash'])) {
            echo json_encode(['status' => 'success', 'admin_token' => $data['admin_token']]);
            exit;
        }

        // パスワード照合
        if (password_verify($password, $data['password_hash'])) {
            echo json_encode(['status' => 'success', 'admin_token' => $data['admin_token']]);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'パスワードが間違っています']);
        }
    } else {
        http_response_code(404); echo json_encode(['error' => 'Not Found']);
    }
    exit;
}

// --- Action: Update Event ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'update') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? '';
    $token = $input['token'] ?? '';
    
    $filename = $DATA_DIR . '/' . $id . '.json';
    if (!file_exists($filename)) {
        http_response_code(404); echo json_encode(['error' => 'Not Found']); exit;
    }

    // ファイルロック
    $fp = fopen($filename, 'r+');
    if (flock($fp, LOCK_EX)) {
        $content = fread($fp, filesize($filename));
        $data = json_decode($content, true);
        
        // 権限チェック
        if (($data['admin_token'] ?? '') !== $token) {
            flock($fp, LOCK_UN);
            fclose($fp);
            http_response_code(403); 
            echo json_encode(['error' => 'Invalid Token']);
            exit;
        }

        // データの更新 (タイトル、説明、期限、ポーリング内容)
        if (isset($input['title'])) $data['title'] = $input['title'];
        if (isset($input['description'])) $data['description'] = $input['description'];
        if (isset($input['deadline'])) $data['deadline'] = $input['deadline'];
        
        // アンケート項目の更新（回答の整合性を保つため、IDベースでマージするか、ここでは単純な上書きとするが要注意）
        // 簡易実装として、既存の構造を維持しつつ上書き
        if (isset($input['polls'])) {
             $data['polls'] = $input['polls'];
        }

        $data['updated_at'] = time();

        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($data, JSON_UNESCAPED_UNICODE));
        flock($fp, LOCK_UN);
        fclose($fp);
        
        echo json_encode(['status' => 'success']);
    } else {
        http_response_code(503); echo json_encode(['error' => 'Busy']);
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

    // ファイルロック機構
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
