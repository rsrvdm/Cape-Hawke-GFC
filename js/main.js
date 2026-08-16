// Cape Hawke GFC — shared behaviour

document.addEventListener('DOMContentLoaded', () => {
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

  // Contact form: placeholder submit handler (no backend wired up yet)
  const form = document.querySelector('#contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const status = form.querySelector('.form-status');
      if (status) {
        status.textContent = 'This form is a placeholder — connect it to your email or a form service (e.g. Formspree) to go live.';
        status.classList.add('show', 'ok');
      }
      form.reset();
    });
  }
});
