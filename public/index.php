
<?php
// index.php
// 通常アクセス時もセキュリティチェックを行うためのエントリーポイント

// セキュリティチェックロジックの読み込み
require_once __DIR__ . '/backend/security.php';

// HTMLモードでチェック実行（ブロック時はHTMLエラーページを表示してexit）
run_security_check(false);

// チェックを通過した場合、index.html (SPAのエントリポイント) を読み込んで出力
$index_html_path = __DIR__ . '/index.html';

if (file_exists($index_html_path)) {
    // Content-Typeヘッダーなどを index.html に合わせる（通常は text/html）
    // security.php で既にヘッダーが出ている可能性もあるが、HTMLとして出力
    readfile($index_html_path);
} else {
    // index.html が見つからない場合のフォールバック
    echo '<!DOCTYPE html><html><body><h1>System Error</h1><p>Application entry point not found.</p></body></html>';
}
?>
