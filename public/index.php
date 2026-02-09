
<?php
// index.php
// 通常アクセス時もセキュリティチェックを行うためのエントリーポイント

// セキュリティチェックロジックの読み込み
require_once __DIR__ . '/backend/security.php';

// HTMLモードでチェック実行（ブロック時はHTMLエラーページを表示してexit）
run_security_check(false);

// チェックを通過した場合、本物のアプリHTML (app_view.html) を読み込んで出力
$app_view_path = __DIR__ . '/app_view.html';

if (file_exists($app_view_path)) {
    // Content-TypeヘッダーなどをHTMLに合わせる
    header('Content-Type: text/html; charset=UTF-8');
    readfile($app_view_path);
} else {
    // ファイルが見つからない場合のフォールバック
    http_response_code(500);
    echo '<!DOCTYPE html><html><body><h1>System Error</h1><p>Application entry point (app_view.html) not found.</p></body></html>';
}
?>
