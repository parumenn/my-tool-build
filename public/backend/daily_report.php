<?php
// JSONレスポンスなどは使わないが、念のためエラー抑制
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
ini_set('display_errors', 0);

// Composer autoload check
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require __DIR__ . '/vendor/autoload.php';
} else {
    exit("PHPMailer library not found. Please run 'composer require phpmailer/phpmailer'.\n");
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$DATA_DIR = __DIR__ . '/data';
$ACCESS_LOG_FILE = $DATA_DIR . '/access_log.json';
$CONFIG_FILE = $DATA_DIR . '/admin_config.json';

// Load Config
if (!file_exists($CONFIG_FILE)) exit("Config file not found.\n");
$config = json_decode(file_get_contents($CONFIG_FILE), true);

if (empty($config['smtp_host']) || empty($config['alert_email'])) {
    exit("SMTP not configured.\n");
}

// Load Logs
if (!file_exists($ACCESS_LOG_FILE)) exit("No logs found.\n");
$logs = json_decode(file_get_contents($ACCESS_LOG_FILE), true);

// Analyze Logs for Today
$today = date('Y-m-d');
$todayLogs = array_filter($logs, function($log) use ($today) {
    return strpos($log['date'], $today) === 0;
});

$totalPV = count($todayLogs);
$byPath = [];
$errorCount = 0;

foreach ($todayLogs as $log) {
    $path = $log['path'] ?? '/';
    if (!isset($byPath[$path])) $byPath[$path] = 0;
    $byPath[$path]++;
    
    if (isset($log['status']) && $log['status'] >= 400) {
        $errorCount++;
    }
}
arsort($byPath);
$topPaths = array_slice($byPath, 0, 5);

// Build Email Body
$body = "Daily Access Report for {$today}\n\n";
$body .= "Total PV: {$totalPV}\n";
$body .= "Errors (4xx/5xx): {$errorCount}\n\n";
$body .= "Top Pages:\n";
foreach ($topPaths as $path => $count) {
    $body .= " - {$path}: {$count}\n";
}
$body .= "\n--\nOmniTools Server";

// Send Email
try {
    if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        exit("PHPMailer class not found.\n");
    }

    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = $config['smtp_host'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $config['smtp_user'];
    $mail->Password   = $config['smtp_pass'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = $config['smtp_port'];
    $mail->CharSet    = 'UTF-8';

    $mail->setFrom($config['smtp_user'], 'OmniTools Report');
    $mail->addAddress($config['alert_email']);

    $mail->Subject = "[OmniTools] Daily Report - {$today}";
    $mail->Body    = $body;

    $mail->send();
    echo "Report sent successfully.\n";
} catch (Exception $e) {
    echo "Message could not be sent. Mailer Error: {$mail->ErrorInfo}\n";
}
?>