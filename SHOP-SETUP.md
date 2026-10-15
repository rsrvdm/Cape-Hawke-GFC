# Merch shop setup

The shop takes payment first. An order email only reaches the club after Stripe confirms the card was charged, so nobody has to chase payment.

## How it works
1. A customer fills a basket on `shop.html` (any mix of items and sizes) and chooses post or pick-up.
2. `shop/checkout.php` re-prices the basket from `shop/products.json` (the browser's prices are never trusted) and sends them to Stripe Checkout.
3. They pay on Stripe's page.
4. Stripe calls `shop/webhook.php`. It checks the signature and the paid status, then emails the order (items, sizes, address, total) to the secretary. A repeated call never sends a second email.

## Steps to go live
1. **Stripe account.** The club treasurer creates it and enters the club's bank details on Stripe directly. Those details are never sent to me.
2. **Products.** Edit `shop/products.json`: real items, prices (in cents), sizes and the postage fee. Replace the sample descriptions.
3. **Config.** On the VentraIP hosting, copy `shop/config.sample.php` to `shop/config.php` and fill in the Stripe secret key, webhook secret, site URL and order email addresses. Never upload `config.php` to GitHub (it is git-ignored and blocked by `.htaccess`).
4. **Webhook.** In Stripe, add an endpoint `https://<club domain>/shop/webhook.php` for the events `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Copy its signing secret into `config.php`.
5. **Test mode first.** Use Stripe test keys and card 4242 4242 4242 4242. Confirm the order email arrives (check spam). If `mail()` is unreliable on the host, tell me and I will switch to SMTP.
6. **Go live.** Swap in the live keys and set `"mode": "live"` in `products.json`. Until then the Merch page shows a "Coming soon" panel and the shop stays hidden.

## Questions for the club
- Which items, prices and sizes? Photos of each?
- Is the club registered for GST?
- Postage fee, or pick-up only?
- Who packs and posts orders?
