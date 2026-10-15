// Cape Hawke GFC — Merch shop (basket + Stripe Checkout)
// Prices shown here are for display only. The server re-prices the basket from shop/products.json.
(function () {
  const grid = document.getElementById('products');
  const cartEl = document.getElementById('cart');
  if (!grid || !cartEl) return;

  const banner = document.getElementById('shop-banner');
  const paidMsg = document.getElementById('paid-msg');
  const KEY = 'chgfc_cart_v1';
  let cat = null;
  let cart = [];
  let delivery = 'post';

  const $ = (tag, props, ...kids) => {
    const el = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v; else el.setAttribute(k, v);
    });
    kids.forEach((k) => el.append(k));
    return el;
  };
  const money = (c) => '$' + (c / 100).toFixed(2);
  const live = () => cat && cat.mode === 'live';

  function load() { try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { cart = []; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }
  const find = (id) => cat.products.find((p) => p.id === id);

  function addToCart(id, size, qty) {
    const hit = cart.find((l) => l.id === id && l.size === size);
    if (hit) hit.qty = Math.min(10, hit.qty + qty); else cart.push({ id, size, qty });
    save(); renderCart();
  }

  function renderProducts() {
    grid.replaceChildren();
    cat.products.filter((p) => p.active).forEach((p) => {
      const sizeSel = p.sizes && p.sizes.length
        ? $('select', { 'aria-label': 'Size for ' + p.name }, $('option', { value: '', text: 'Choose size' }), ...p.sizes.map((s) => $('option', { value: s, text: s })))
        : null;
      const msg = $('p', { class: 'form-note', role: 'status', 'aria-live': 'polite' });
      const btn = $('button', { type: 'button', class: 'btn btn-gold', text: 'Add to basket' });
      btn.addEventListener('click', () => {
        if (sizeSel && !sizeSel.value) { msg.textContent = 'Please choose a size.'; return; }
        msg.textContent = 'Added to basket.';
        addToCart(p.id, sizeSel ? sizeSel.value : '', 1);
      });
      const img = p.image
        ? $('img', { class: 'product-img', src: p.image, alt: p.name })
        : $('div', { class: 'product-img product-img-ph', 'aria-hidden': 'true', text: 'CHGFC' });
      grid.append($('div', { class: 'card product-card' }, img,
        $('h3', { text: p.name }), $('p', { class: 'product-price', text: money(p.price) }),
        $('p', { text: p.description }), ...(sizeSel ? [$('div', { class: 'field' }, sizeSel)] : []), btn, msg));
    });
  }

  function renderCart() {
    cartEl.replaceChildren($('h3', { text: 'Your basket' }));
    cart = cart.filter((l) => find(l.id));
    if (!cart.length) { cartEl.append($('p', { text: 'Your basket is empty.' })); return; }

    let sub = 0;
    cart.forEach((l) => {
      const p = find(l.id); sub += p.price * l.qty;
      const minus = $('button', { type: 'button', class: 'qty-btn', 'aria-label': 'Fewer ' + p.name, text: '−' });
      const plus = $('button', { type: 'button', class: 'qty-btn', 'aria-label': 'More ' + p.name, text: '+' });
      const rm = $('button', { type: 'button', class: 'link-btn', text: 'Remove' });
      minus.addEventListener('click', () => { l.qty = Math.max(1, l.qty - 1); save(); renderCart(); });
      plus.addEventListener('click', () => { l.qty = Math.min(10, l.qty + 1); save(); renderCart(); });
      rm.addEventListener('click', () => { cart = cart.filter((x) => x !== l); save(); renderCart(); });
      cartEl.append($('div', { class: 'cart-line' },
        $('div', { class: 'cart-name' }, $('strong', { text: p.name }), $('span', { text: l.size ? 'Size ' + l.size : '' })),
        $('div', { class: 'cart-qty' }, minus, $('span', { text: String(l.qty) }), plus),
        $('div', { class: 'cart-price', text: money(p.price * l.qty) }), rm));
    });

    const dChoices = $('div', { class: 'choices' });
    Object.entries(cat.delivery).forEach(([key, d]) => {
      const r = $('input', { type: 'radio', name: 'delivery', value: key });
      if (key === delivery) r.checked = true;
      r.addEventListener('change', () => { delivery = key; renderCart(); });
      dChoices.append($('label', { class: 'choice' }, r, document.createTextNode(' ' + d.label + (d.fee ? ' (' + money(d.fee) + ')' : ' (free)'))));
    });
    const fee = cat.delivery[delivery].fee;
    cartEl.append($('div', { class: 'field full' }, $('span', { class: 'legend', text: 'Delivery' }), dChoices));
    cartEl.append($('div', { class: 'cart-total' }, $('span', { text: 'Subtotal ' + money(sub) }), $('span', { text: 'Delivery ' + money(fee) }),
      $('strong', { text: 'Total ' + money(sub + fee) })));
    if (cat.gst_note) cartEl.append($('p', { class: 'form-note', text: cat.gst_note }));

    const pay = $('button', { type: 'button', class: 'btn btn-gold', text: live() ? 'Pay securely by card' : 'Checkout not open yet' });
    const status = $('div', { class: 'form-status', role: 'status', 'aria-live': 'polite' });
    pay.disabled = !live();
    pay.addEventListener('click', async () => {
      pay.disabled = true; status.className = 'form-status show ok'; status.textContent = 'Taking you to the secure payment page…';
      try {
        const res = await fetch('shop/checkout.php', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delivery, items: cart.map(({ id, size, qty }) => ({ id, size, qty })) }),
        });
        const j = await res.json();
        if (!res.ok || !j.url) throw new Error(j.error || 'Checkout failed');
        window.location.href = j.url;
      } catch (e) {
        status.className = 'form-status show err'; status.textContent = e.message; pay.disabled = false;
      }
    });
    cartEl.append(pay, status);
  }

  async function init() {
    load();
    try {
      cat = window.CHGFC_PRODUCTS || await (await fetch('shop/products.json', { cache: 'no-store' })).json();
    } catch (e) {
      grid.append($('p', { text: 'The merch shop could not be loaded. Please try again later.' }));
      return;
    }
    // The shop stays hidden behind the "coming soon" panel until products.json says "mode": "live".
    if (!live()) return;
    const app = document.getElementById('shop-app'), soon = document.getElementById('shop-soon');
    if (app) app.hidden = false;
    if (soon) soon.hidden = true;
    if (new URLSearchParams(location.search).get('paid') === '1' && paidMsg) {
      paidMsg.hidden = false; cart = []; save();
    }
    renderProducts(); renderCart();
  }
  init();
})();
