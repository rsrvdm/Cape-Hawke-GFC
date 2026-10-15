<?php
// Stripe calls this after a payment. The order email is sent ONLY when Stripe says the
// checkout is paid, and only once per session (a record file prevents duplicates).
require __DIR__ . '/lib.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { json_out(405, ['error' => 'POST only']); }

$payload = file_get_contents('php://input');
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

try {
    $cfg = shop_config();
    if (!stripe_verify_signature($payload, $sigHeader, $cfg['stripe_webhook_secret'])) {
        json_out(400, ['error' => 'Invalid signature']);
    }
    $event = json_decode($payload, true);
    $type = $event['type'] ?? '';
    if (!in_array($type, ['checkout.session.completed', 'checkout.session.async_payment_succeeded'], true)) {
        json_out(200, ['ignored' => $type]);
    }
    $session = $event['data']['object'] ?? [];
    if (($session['payment_status'] ?? '') !== 'paid') { json_out(200, ['ignored' => 'not paid yet']); }

    $sid = (string)($session['id'] ?? '');
    if (!preg_match('/^cs_[A-Za-z0-9_]+$/', $sid)) { json_out(400, ['error' => 'Bad session id']); }

    // Duplicate protection: claim the session atomically before sending anything.
    $record = __DIR__ . '/orders/' . $sid . '.json';
    $fh = @fopen($record, 'x');
    if ($fh === false) { json_out(200, ['duplicate' => true]); }

    $items = stripe_call('GET', '/v1/checkout/sessions/' . $sid . '/line_items', ['limit' => 100]);
    $cust = $session['customer_details'] ?? [];
    $ship = $session['shipping_details'] ?? ($session['collected_information']['shipping_details'] ?? null);
    $delivery = $session['metadata']['delivery'] ?? 'post';

    $body = "A merch order has been PAID and is ready to send.\n\n";
    $body .= "Customer: " . ($cust['name'] ?? '') . "\n";
    $body .= "Email:    " . ($cust['email'] ?? '') . "\n";
    $body .= "Phone:    " . ($cust['phone'] ?? '') . "\n\n";
    $body .= "Items:\n";
    foreach ($items['data'] ?? [] as $li) {
        $body .= sprintf("  %d x %s  (%s)\n", $li['quantity'], $li['description'], money((int)$li['amount_total']));
    }
    $body .= "\nTotal paid: " . money((int)($session['amount_total'] ?? 0)) . "\n";
    if ($delivery === 'pickup') {
        $body .= "\nDELIVERY: PICK UP at a club event (do not post).\n";
    } else {
        $a = $ship['address'] ?? [];
        $body .= "\nDELIVERY: POST to\n  " . ($ship['name'] ?? ($cust['name'] ?? '')) . "\n";
        foreach (['line1', 'line2'] as $k) { if (!empty($a[$k])) { $body .= '  ' . $a[$k] . "\n"; } }
        $body .= '  ' . trim(($a['city'] ?? '') . ' ' . ($a['state'] ?? '') . ' ' . ($a['postal_code'] ?? '')) . "\n";
    }
    $body .= "\nStripe reference: " . $sid . "\n";

    $ok = send_order_email('PAID merch order: ' . ($cust['name'] ?? 'customer'), $body, $cust['email'] ?? null);
    fwrite($fh, json_encode(['session' => $sid, 'emailed' => $ok, 'at' => date('c')]));
    fclose($fh);

    if (!$ok) {
        // Let Stripe retry: remove the claim so the next attempt can send the email.
        @unlink($record);
        json_out(500, ['error' => 'Email failed']);
    }
    json_out(200, ['ok' => true]);
} catch (Throwable $e) {
    if (isset($record) && isset($fh) && is_resource($fh)) { fclose($fh); @unlink($record); }
    error_log('[chgfc-shop] webhook: ' . $e->getMessage());
    json_out(500, ['error' => 'Webhook error']);
}
