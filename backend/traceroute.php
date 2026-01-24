<?php
// Increase execution time for traceroute (it takes time)
ini_set('max_execution_time', 90);

// Security headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json; charset=UTF-8");

$host = $_GET['host'] ?? '';

// 1. Validation
if (empty($host)) {
    http_response_code(400);
    echo json_encode(['error' => 'Host is required']);
    exit;
}

// Remove protocol and path
$host = preg_replace('#^https?://#', '', $host);
$host = explode('/', $host)[0];

// Validate format
if (!filter_var($host, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME) && !filter_var($host, FILTER_VALIDATE_IP)) {
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
    
    // Common paths
    $possiblePaths = ['/usr/sbin/traceroute', '/usr/bin/traceroute', '/bin/traceroute'];
    foreach ($possiblePaths as $p) {
        if (file_exists($p) && is_executable($p)) {
            $binary = $p;
            break;
        }
    }

    // Try `which` if not found in common paths
    if (empty($binary)) {
        $which = trim(shell_exec('which traceroute 2>/dev/null'));
        if (!empty($which) && is_executable($which)) {
            $binary = $which;
        }
    }

    // Fallback
    if (empty($binary)) {
        $binary = 'traceroute';
    }

    // -n: no DNS lookup (faster), -m: max hops, -w: timeout (sec), -q: queries per hop
    $command = "$binary -n -m $maxHops -w 1 -q 1 $escapedHost 2>&1";
}

// 3. Execute
$output = [];
$returnVar = 0;
// Note: If exec() is disabled in php.ini, this will fail silently or throw a warning.
// Check php.ini disable_functions if it doesn't work.
exec($command, $output, $returnVar);

// 4. Parse Output
$hops = [];
foreach ($output as $line) {
    $line = trim($line);
    if (empty($line)) continue;
    
    // Parse Logic
    // Linux:  " 1  192.168.1.1  0.123 ms"
    // Windows: " 1    <1 ms    <1 ms    <1 ms  192.168.1.1"
    
    // Extract IP
    if (preg_match('/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/', $line, $ipMatch)) {
        $ip = $ipMatch[1];
        
        // Extract Hop Number
        preg_match('/^\s*(\d+)/', $line, $hopMatch);
        $hopNum = $hopMatch[1] ?? count($hops) + 1;

        // Extract RTT
        $rtt = '';
        if (preg_match('/([\d\.<]+)\s*ms/', $line, $rttMatch)) {
            $rtt = $rttMatch[1] . ' ms';
        } elseif (strpos($line, '*') !== false) {
            $rtt = '*';
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
    // If no hops, check if command exists
    if ($returnVar === 127 || (count($output) === 0 && $returnVar !== 0)) {
        http_response_code(500);
        echo json_encode([
            'error' => 'Traceroute command failed. Please install it (sudo apt install traceroute) or check exec() permissions.',
            'debug_cmd' => $command
        ]);
        exit;
    }
}

echo json_encode([
    'host' => $host,
    'hops' => $hops,
    'method' => 'System Command (exec)'
]);
?>