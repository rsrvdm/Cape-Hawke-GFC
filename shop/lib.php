<?php
// Shared helpers for the CHGFC shop. Not reachable from the web (see .htaccess).

function shop_config(): array {
    static $cfg = null;
    if ($cfg === null) {
        $path = __DIR__ . '/config.php';
        if (!is_file($path)) { throw new RuntimeException('shop/config.php is missing'); }
        $cfg = require $path;
    }
    return $cfg;
}

function shop_catalogue(): array {
    $raw = file_get_contents(__DIR__ . '/products.json');
    $data = json_decode($raw, true);
    if (!is_array($data) || !isset($data['products'])) { throw new RuntimeException('products.json is invalid'); }
    return $data;
}

function json_out(int $status, array $body): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($body);
    exit;
}

// Call the Stripe API (form-encoded). $method is GET or POST.
function stripe_call(string $method, string $path, array $params = []): array {
    $cfg = shop_config();
    $url = rtrim($cfg['stripe_api_base'], '/') . $path;
    $ch = curl_init();
    if ($method === 'GET') {
        if ($params) { $url .= '?' . http_build_query($params); }
    } else {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    }
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . $cfg['stripe_secret_key']],
    ]);
    $out = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($out === false) { throw new RuntimeException('Stripe request failed: ' . $err); }
    $json = json_decode($out, true);
    if (!is_array($json)) { throw new RuntimeException('Stripe returned a non-JSON response'); }
    if ($code >= 400) {
        $msg = $json['error']['message'] ?? ('HTTP ' . $code);
        throw new RuntimeException('Stripe error: ' . $msg);
    }
    return $json;
}

// Verify a Stripe webhook signature. Returns true only for a valid, recent signature.
function stripe_verify_signature(string $payload, string $header, string $secret, int $tolerance = 300, ?int $now = null): bool {
    $now = $now ?? time();
    $ts = null; $sigs = [];
    foreach (explode(',', $header) as $part) {
        $kv = explode('=', trim($part), 2);
        if (count($kv) !== 2) { continue; }
        if ($kv[0] === 't') { $ts = (int)$kv[1]; }
        if ($kv[0] === 'v1') { $sigs[] = $kv[1]; }
    }
    if ($ts === null || !$sigs) { return false; }
    if (abs($now - $ts) > $tolerance) { return false; }
    $expected = hash_hmac('sha256', $ts . '.' . $payload, $secret);
    foreach ($sigs as $s) { if (hash_equals($expected, $s)) { return true; } }
    return false;
}

function money(int $cents): string { return '$' . number_format($cents / 100, 2); }

function send_order_email(string $subject, string $body, ?string $replyTo = null): bool {
    $cfg = shop_config();
    if (($cfg['mail_mode'] ?? 'mail') === 'log') {
        return file_put_contents(__DIR__ . '/orders/mail.log', "=== $subject\n$body\n\n", FILE_APPEND) !== false;
    }
    $headers = ['From: Cape Hawke GFC shop <' . $cfg['order_email_from'] . '>', 'Content-Type: text/plain; charset=utf-8'];
    if ($replyTo && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) { $headers[] = 'Reply-To: ' . $replyTo; }
    return mail($cfg['order_email_to'], $subject, $body, implode("\r\n", $headers), '-f' . $cfg['order_email_from']);
}
