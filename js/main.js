// Cape Hawke GFC — shared behaviour

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-current-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Tideline signature: gentle animated water-level path.
  // Amplitude/offset drift slowly to suggest a live tide, without being busy.
  document.querySelectorAll('.tideline path').forEach((path, i) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let t = i * 40;
    const base = path.getAttribute('data-base') || path.getAttribute('d');
    function animate() {
      t += 0.006;
      const amp = 8;
      const y1 = 32 + Math.sin(t) * amp;
      const y2 = 32 + Math.sin(t + 1.4) * amp;
      const y3 = 32 + Math.sin(t + 2.8) * amp;
      path.setAttribute('d', `M0,${y1} C 300,${y2} 900,${y3} 1440,${y1} L1440,64 L0,64 Z`);
      requestAnimationFrame(animate);
    }
    animate();
  });

  // Membership application: sent to the club secretary through Web3Forms
  const join = document.querySelector('#join-form');
  if (join) {
    join.addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = join.querySelector('.form-status');
      const btn = join.querySelector('button[type="submit"]');
      const show = (msg, ok) => {
        status.textContent = msg;
        status.classList.add('show');
        status.classList.toggle('ok', ok);
        status.classList.toggle('err', !ok);
      };
      const data = Object.fromEntries(new FormData(join));
      if (!data.access_key || data.access_key === 'YOUR_ACCESS_KEY_HERE') {
        show('This form is not connected yet, so no application was sent.', false);
        return;
      }
      data.application_date = new Date().toLocaleDateString('en-AU');
      btn.disabled = true;
      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'failed');
        show('Thanks! Your application has been sent to the club secretary.', true);
        join.reset();
      } catch (err) {
        show('Sorry, something went wrong. Please email your details to secretary@capehawkegfc.com.au.', false);
      } finally {
        btn.disabled = false;
      }
    });
  }

  // Contact form: opens the visitor's email app addressed to the club secretary
  const form = document.querySelector('#contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = (id) => (form.querySelector('#' + id) || {}).value || '';
      const subject = 'Website enquiry: ' + v('reason');
      const body = v('message') + '\n\nFrom: ' + v('name') + '\nEmail: ' + v('email');
      window.location.href = 'mailto:secretary@capehawkegfc.com.au?subject=' +
        encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      const status = form.querySelector('.form-status');
      if (status) {
        status.textContent = 'Your email app should open with your message ready to send.';
        status.classList.add('show', 'ok');
      }
    });
  }
});

/* Community partners: order rotates once a day (Sydney date) so every
   partner takes a turn at the top. Without JavaScript the list stays
   alphabetical. All partners are always shown. */
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('community-partners');
  if (!grid) return;
  const tiles = Array.from(grid.children);
  if (tiles.length < 2) return;
  let day;
  try {
    day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date());
  } catch (e) { day = new Date().toISOString().slice(0, 10); }
  let seed = 0;
  for (let i = 0; i < day.length; i++) seed = (seed * 31 + day.charCodeAt(i)) >>> 0;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  tiles.forEach((t) => grid.appendChild(t));

});
