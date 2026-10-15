<?php
// Receives the basket from the Merch page, re-prices it from products.json (never trusts
// browser prices), and creates a Stripe Checkout session. No order email is sent here.
require __DIR__ . '/lib.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { json_out(405, ['error' => 'POST only']); }

try {
    $cfg = shop_config();
    $cat = shop_catalogue();
    if (($cat['mode'] ?? 'sample') !== 'live') { json_out(403, ['error' => 'The shop is not open yet.']); }

    $in = json_decode(file_get_contents('php://input'), true);
    if (!is_array($in) || empty($in['items']) || !is_array($in['items'])) { json_out(400, ['error' => 'Your basket is empty.']); }
    $delivery = ($in['delivery'] ?? '') === 'pickup' ? 'pickup' : 'post';
    if (count($in['items']) > 20) { json_out(400, ['error' => 'Too many items in the basket.']); }

    $products = [];
    foreach ($cat['products'] as $p) { if (!empty($p['active'])) { $products[$p['id']] = $p; } }

    $lines = [];
    foreach ($in['items'] as $it) {
        $id = (string)($it['id'] ?? '');
        $qty = (int)($it['qty'] ?? 0);
        $size = trim((string)($it['size'] ?? ''));
        if (!isset($products[$id])) { json_out(400, ['error' => 'An item in your basket is no longer available.']); }
        $p = $products[$id];
        if ($qty < 1 || $qty > 10) { json_out(400, ['error' => 'Quantity must be between 1 and 10.']); }
        if (!empty($p['sizes'])) {
            if (!in_array($size, $p['sizes'], true)) { json_out(400, ['error' => 'Please choose a size for ' . $p['name'] . '.']); }
        } else { $size = ''; }
        $lines[] = [
            'price_data' => [
                'currency' => $cat['currency'] ?? 'aud',
                'unit_amount' => (int)$p['price'],
                'product_data' => ['name' => $p['name'] . ($size !== '' ? " (size $size)" : '')],
            ],
            'quantity' => $qty,
        ];
    }

    $d = $cat['delivery'][$delivery];
    $params = [
        'mode' => 'payment',
        'line_items' => $lines,
        'success_url' => $cfg['site_url'] . '/shop.html?paid=1',
        'cancel_url'  => $cfg['site_url'] . '/shop.html',
        'phone_number_collection' => ['enabled' => 'true'],
        'metadata' => ['delivery' => $delivery, 'delivery_label' => $d['label']],
        'payment_intent_data' => ['metadata' => ['delivery' => $delivery]],
    ];
    if ($delivery === 'post') {
        $params['shipping_address_collection'] = ['allowed_countries' => ['AU']];
        $params['shipping_options'] = [[
            'shipping_rate_data' => [
                'type' => 'fixed_amount',
                'display_name' => $d['label'],
                'fixed_amount' => ['amount' => (int)$d['fee'], 'currency' => $cat['currency'] ?? 'aud'],
            ],
        ]];
    }

    $session = stripe_call('POST', '/v1/checkout/sessions', $params);
    json_out(200, ['url' => $session['url']]);
} catch (Throwable $e) {
    error_log('[chgfc-shop] checkout: ' . $e->getMessage());
    json_out(500, ['error' => 'Sorry, checkout is unavailable right now. Please email secretary@capehawkegfc.com.au.']);
}
