<?php
/**
 * Traceroute Backend for OmniTools
 * 安全に出力バッファを制御し、純粋なJSONのみを返却します。
 */
ob_start();
error_reporting(0);
ini_set('display_errors', 0);
ini_set('max_execution_time', 120); // 処理時間を十分に確保

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json; charset=UTF-8");

$host = $_GET['host'] ?? '';

// 1. Validation
if (empty($host)) {
    ob_clean();
    http_response_code(400);
    echo json_encode(['error' => 'Host is required']);
    exit;
}

// Remove protocol and path
$host = preg_replace('#^https?://#', '', $host);
$host = explode('/', $host)[0];

// Validate format
if (!filter_var($host, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME) && !filter_var($host, FILTER_VALIDATE_IP)) {
    ob_clean();
    http_response_code(400);
    echo json_encode(['error' => 'Invalid hostname or IP']);
    exit;
}

// 2. OS Detection & Command Setup
$isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
$maxHops = 20; // Limit hops
$escapedHost = escapeshellarg($host);
$command = "";

if ($isWindows) {
    // Windows: tracert
    $command = "tracert -d -h $maxHops -w 100 $escapedHost";
} else {
    // Linux: Find traceroute binary
    $binary = '';
    $possiblePaths = ['/usr/sbin/traceroute', '/usr/bin/traceroute', '/bin/traceroute', '/usr/local/bin/traceroute'];
    foreach ($possiblePaths as $p) {
        if (@file_exists($p) && @is_executable($p)) {
            $binary = $p;
            break;
        }
    }
    if (empty($binary)) {
        $binary = 'traceroute';
    }
    // -n: no DNS lookup, -m: max hops, -w: timeout, -q: queries per hop
    $command = "$binary -n -m $maxHops -w 1 -q 1 $escapedHost 2>&1";
}

// 3. Execute
$output = [];
$returnVar = 0;
@exec($command, $output, $returnVar);

// 4. Parse Output
$hops = [];
foreach ($output as $line) {
    $line = trim($line);
    if (empty($line)) continue;
    
    // Extract IP
    if (preg_match('/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/', $line, $ipMatch)) {
        $ip = $ipMatch[1];
        
        // Extract Hop Number
        preg_match('/^\s*(\d+)/', $line, $hopMatch);
        $hopNum = $hopMatch[1] ?? count($hops) + 1;

        // Extract RTT
        $rtt = '*';
        if (preg_match('/([\d\.<]+)\s*ms/', $line, $rttMatch)) {
            $rtt = $rttMatch[1] . ' ms';
        }

        $hops[] = [
            'hop' => (int)$hopNum,
            'ip' => $ip,
            'rtt' => $rtt
        ];
    }
}

// 5. Error Handling
if (empty($hops)) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['error' => '経路情報を取得できませんでした。サーバー設定を確認してください。']);
    exit;
}

ob_clean();
echo json_encode([
    'host' => $host,
    'hops' => $hops,
    'status' => 'success'
]);
exit;