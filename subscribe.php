<?php

ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond($status, $success, $message)
{
    http_response_code($status);

    echo json_encode([
        'success' => $success,
        'message' => $message,
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, false, 'Method not allowed.');
}

try {
    $envFile = '/opt/.env';

    if (is_readable($envFile)) {
        foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);

            if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) {
                continue;
            }

            putenv($line);
        }
    }

    $secret = getenv('RECAPTCHA_SECRET');
    $apiKey = getenv('BUTTONDOWN_API_KEY');

    if (!$secret || !$apiKey || !function_exists('curl_init')) {
        error_log('Newsletter: missing configuration or cURL extension.');
        respond(500, false, 'Subscription is temporarily unavailable.');
    }

    $email = $_POST['email'] ?? '';
    $captchaToken = $_POST['g-recaptcha-response'] ?? '';

    if (!is_string($email) || !is_string($captchaToken)) {
        respond(422, false, 'Invalid form data.');
    }

    $email = trim($email);
    $captchaToken = trim($captchaToken);

    if (strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        respond(422, false, 'Please enter a valid email address.');
    }

    if ($captchaToken === '') {
        respond(422, false, 'Please complete the CAPTCHA.');
    }

    require_once __DIR__ . '/autoload.php';

    $recaptcha = new \ReCaptcha\ReCaptcha($secret);

    $verification = $recaptcha->verify(
        $captchaToken,
        $_SERVER['REMOTE_ADDR'] ?? null
    );

    $allowedHostnames = [
        'v2minc.com',
        'www.v2minc.com',
    ];

    if (
        !$verification->isSuccess()
        || !in_array($verification->getHostname(), $allowedHostnames, true)
    ) {
        respond(422, false, 'CAPTCHA verification failed. Please try again.');
    }

    $payload = [
        'email_address' => $email,
        'type' => 'unactivated',
    ];

    $curl = curl_init('https://api.buttondown.com/v1/subscribers');

    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_HTTPHEADER => [
            'Authorization: Token ' . $apiKey,
            'Content-Type: application/json',
            'Accept: application/json',
            'X-Buttondown-Collision-Behavior: add',
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
    ]);

    $body = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $curlError = curl_errno($curl);

    curl_close($curl);

    if ($body === false || $curlError !== 0) {
        error_log('Newsletter: connection error ' . $curlError);
        respond(502, false, 'Could not connect. Please try again later.');
    }

    if ($status === 429) {
        respond(429, false, 'Please try again later.');
    }

    if ($status < 200 || $status >= 300) {
        error_log('Newsletter: Buttondown returned HTTP ' . $status);
        respond(502, false, 'Could not complete your request. Please try again later.');
    }

    respond(
        200,
        true,
        'Check your inbox for subscription details. If you are already subscribed, no action is needed.'
    );
} catch (\Throwable $exception) {
    error_log('Newsletter: internal error (' . get_class($exception) . ').');
    respond(500, false, 'Subscription is temporarily unavailable.');
}