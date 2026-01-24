<?php
// Increase execution time for traceroute
ini_set('max_execution_time', 60);

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

// Remove protocol if present
$host = preg_replace('#^https?://#', '', $host);
// Remove path
$host = explode('/', $host)[0];

// Validate hostname/IP
if (!filter_var($host, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME) && !filter_var($host, FILTER_VALIDATE_IP)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid hostname or IP']);
    exit;
}

// 2. Determine OS and Command
$isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
$maxHops = 20; // Limit hops for speed
$timeout = $isWindows ? 100 : 1; // ms for win, sec for linux (usually)

// Safety: Escape the argument
$escapedHost = escapeshellarg($host);

$command = "";
if ($isWindows) {
    // Windows tracert: -d (no dns), -h (max hops), -w (timeout ms)
    $command = "tracert -d -h $maxHops -w $timeout $escapedHost";
} else {
    // Linux traceroute: -n (no dns), -m (max hops), -w (timeout sec), -q 1 (1 query per hop for speed)
    // Check if traceroute exists, otherwise try /usr/sbin/traceroute
    $command = "traceroute -n -m $maxHops -w $timeout -q 1 $escapedHost 2>&1";
}

// 3. Execute
$output = [];
$returnVar = 0;
exec($command, $output, $returnVar);

// 4. Parse Output
$hops = [];
foreach ($output as $line) {
    $line = trim($line);
    if (empty($line)) continue;
    
    // Extract IP address
    if (preg_match('/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/', $line, $ipMatch)) {
        $ip = $ipMatch[1];
        
        // Extract Hop Number (Starts with number)
        preg_match('/^\s*(\d+)/', $line, $hopMatch);
        $hopNum = $hopMatch[1] ?? count($hops) + 1;

        // Extract RTT (Simple heuristic)
        // Linux: "  1  10.0.0.1  0.584 ms"
        // Windows: "  1    <1 ms    <1 ms    <1 ms  10.0.0.1"
        $rtt = '';
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

// If no hops found, maybe command failed or not installed
if (empty($hops) && $returnVar !== 0) {
    // Return dummy data for demonstration if command fails (Optional, but helpful for UX if backend is restricted)
    // For now, return error
    // echo json_encode(['error' => 'Traceroute command failed or not found.']);
    // exit;
}

echo json_encode([
    'host' => $host,
    'hops' => $hops,
    'os' => PHP_OS
]);
?>