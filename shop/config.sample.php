<?php
// Copy this file to config.php (same folder) and fill it in on the server.
// config.php must NEVER be committed or shared: it holds the Stripe secret key.
return [
    // Stripe > Developers > API keys. Use the TEST key (sk_test_...) until you are ready to go live.
    'stripe_secret_key'     => 'sk_test_REPLACE_ME',
    // Stripe > Developers > Webhooks > your endpoint > Signing secret (whsec_...)
    'stripe_webhook_secret' => 'whsec_REPLACE_ME',

    // Public address of the site, no trailing slash.
    'site_url'              => 'https://www.capehawkegfc.com.au',

    // Who gets the "order paid" email, and who it appears to come from.
    'order_email_to'        => 'secretary@capehawkegfc.com.au',
    'order_email_from'      => 'shop@capehawkegfc.com.au',

    // 'mail' uses the server's mail(); 'log' writes emails to shop/orders/mail.log (testing only).
    'mail_mode'             => 'mail',

    // Leave as is. Only changed for automated tests.
    'stripe_api_base'       => 'https://api.stripe.com',
];
