// Cape Hawke GFC — season calendar (July 2026 to June 2027)
// To change a date, edit the list below. Format: 'date|time|category|title|end date (optional)'.
(function () {
  const CATS = {
    meeting: { label: 'Club meeting', cls: 'c-meeting' },
    tournament: { label: 'Club tournament', cls: 'c-tournament' },
    points: { label: 'Club Major Points score', cls: 'c-points' },
    pointsnz: { label: 'Major Points (same weekend as Northern Zone, supported by committee)', cls: 'c-pointsnz' },
    nz: { label: 'Northern Zone (NS), not supported by committee', cls: 'c-nz' },
    other: { label: 'Other club tournament', cls: 'c-other' },
    social: { label: 'Social', cls: 'c-social' }
  };
  const RAW = [
    '2026-07-03|1800|points|Brief', '2026-07-04|0800 - 1600|points|Major Points', '2026-07-05|0800 - 1500|points|Major Points', '2026-07-16|1730|meeting|Committee Meeting',
    '2026-08-07|1800|points|Brief', '2026-08-08|0700 - 1600|points|Major Points', '2026-08-09|0700 - 1600|points|Major Points & BBQ', '2026-08-13|1730|meeting|Committee Meeting',
    '2026-09-05|0700 - 1700|nz|Northern Zone (NS)', '2026-09-06|0700 - 1700|nz|Northern Zone (NS)', '2026-09-10|1730|meeting|General Meeting',
    '2026-09-11|1800|tournament|Brief', '2026-09-12|0700 - 1700|tournament|Major Points', '2026-09-13|0700 - 1700|tournament|Major Points, BBQ & Presentation',
    '2026-10-02|1800|pointsnz|Brief', '2026-10-03|0700 - 1700|pointsnz|Major Points', '2026-10-04|0700 - 1700|pointsnz|Major Points & BBQ', '2026-10-15|1730|meeting|Committee Meeting',
    '2026-11-06|1800|pointsnz|Brief', '2026-11-07|0700 - 1700|pointsnz|Major Points', '2026-11-08|0700 - 1700|pointsnz|Major Points & BBQ', '2026-11-12|1730|meeting|Committee Meeting',
    '2026-12-03|1730|meeting|General Meeting', '2026-12-05|1200|social|Christmas Party', '2026-12-05|0700 - 1700|nz|Northern Zone (NS)', '2026-12-06|0700 - 1700|nz|Northern Zone (NS)',
    '2026-12-11|1800|tournament|Brief', '2026-12-12|0700 - 1700|tournament|Major Points', '2026-12-13|0700 - 1700|tournament|Major Points, BBQ & Presentation',
    '2027-01-02|0700 - 1700|nz|Northern Zone (NS)', '2027-01-03|0700 - 1700|nz|Northern Zone (NS)', '2027-01-07||other|Port Macquarie Golden Lure Tournament|2027-01-16',
    '2027-01-21|1730|meeting|Committee Meeting', '2027-01-29|1800|points|Brief', '2027-01-30|0700 - 1700|points|Major Points', '2027-01-31|0700 - 1700|points|Major Points & BBQ',
    '2027-02-06|0700 - 1700|nz|Northern Zone (NS)', '2027-02-07|0700 - 1700|nz|Northern Zone (NS)', '2027-02-13|0700 - 1700|other|Major Points (NS) · Club Fishing Billfish Shoot Out', '2027-02-14|0700 - 1700|other|Major Points (NS) · Club Fishing Billfish Shoot Out', '2027-02-18|1730|meeting|Committee Meeting',
    '2027-03-06|0700 - 1700|nz|Northern Zone (NS)', '2027-03-07|0700 - 1700|nz|Northern Zone (NS)', '2027-03-12|1800|tournament|Brief', '2027-03-13|0700 - 1700|tournament|Major Points', '2027-03-14|0700 - 1700|tournament|Major Points, BBQ & Presentation', '2027-03-18|1730|meeting|General Meeting',
    '2027-04-03|0700 - 1700|nz|Northern Zone (NS)', '2027-04-04|0700 - 1700|nz|Northern Zone (NS)', '2027-04-09|1800|tournament|Brief', '2027-04-10|0700 - 1700|tournament|Major Points', '2027-04-11|0700 - 1700|tournament|Major Points, BBQ & Presentation', '2027-04-15|1730|meeting|Committee Meeting',
    '2027-05-01|0700 - 1700|nz|Northern Zone (NS)', '2027-05-02|0700 - 1700|nz|Northern Zone (NS)', '2027-05-07|1800|points|Brief', '2027-05-08|0700 - 1700|points|Major Points', '2027-05-09|0700 - 1700|points|Major Points & BBQ', '2027-05-13|1730|meeting|Committee Meeting',
    '2027-06-04|1800|points|Brief', '2027-06-05|0700 - 1700|points|Major Points', '2027-06-06|0700 - 1700|points|Major Points & BBQ', '2027-06-10|1800|meeting|Annual General Meeting', '2027-06-17|1730|meeting|Committee Meeting'
  ];
  const TBC = [{ month: '2027-01', title: 'Coffs Harbour Hot Current Tournament', note: 'Dates to be confirmed', cat: 'other' }];

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = (s) => { const [y, m, dd] = s.split('-').map(Number); return new Date(y, m - 1, dd); };
  const ordinal = (n) => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');
  const fmtTime = (t) => (t ? t.replace(/(\d{4})/g, '$1h') : '');
  const todayStr = () => { const n = new Date(); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0'); };

  const events = RAW.map((r) => { const p = r.split('|'); return { date: p[0], time: p[1], cat: p[2], title: p[3], end: p[4] || '' }; });
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
  const dayLabel = (e) => {
    const a = d(e.date);
    if (e.end) { const b = d(e.end); return ordinal(a.getDate()) + ' to ' + ordinal(b.getDate()) + ' ' + MONTHS[b.getMonth()].slice(0, 3); }
    return DAYS[a.getDay()].slice(0, 3) + ' ' + ordinal(a.getDate());
  };

  const host = document.getElementById('calendar');
  if (host) {
    const filters = document.getElementById('cal-filters');
    const list = document.getElementById('cal-list');
    let hidden = {}; let showPast = false;
    function render() {
      list.replaceChildren();
      const today = todayStr();
      const byMonth = {};
      events.forEach((e) => { (byMonth[e.date.slice(0, 7)] = byMonth[e.date.slice(0, 7)] || []).push(e); });
      TBC.forEach((t) => { (byMonth[t.month] = byMonth[t.month] || []).push({ date: t.month + '-31', tbc: true, title: t.title, time: '', note: t.note, cat: t.cat }); });
      Object.keys(byMonth).sort().forEach((k) => {
        const rows = byMonth[k].filter((e) => !hidden[e.cat] && (showPast || (e.end || e.date) >= today));
        if (!rows.length) return;
        const [y, m] = k.split('-').map(Number);
        const box = el('div', 'cal-month');
        box.append(el('h3', '', MONTHS[m - 1] + ' ' + y));
        rows.forEach((e) => {
          const past = (e.end || e.date) < today;
          const r = el('div', 'cal-row ' + CATS[e.cat].cls + (past ? ' past' : ''));
          r.append(el('span', 'cal-day', e.tbc ? 'TBC' : dayLabel(e)));
          const w = el('span', 'cal-what'); w.append(el('strong', '', e.title));
          if (e.note) w.append(el('em', '', e.note));
          r.append(w, el('span', 'cal-time', fmtTime(e.time)));
          box.append(r);
        });
        list.append(box);
      });
      if (!list.children.length) list.append(el('p', '', 'No events to show. Try turning on more event types.'));
    }
    Object.keys(CATS).forEach((k) => {
      const b = el('button', 'cal-chip ' + CATS[k].cls, CATS[k].label);
      b.type = 'button'; b.setAttribute('aria-pressed', 'true');
      b.addEventListener('click', () => { hidden[k] = !hidden[k]; b.setAttribute('aria-pressed', hidden[k] ? 'false' : 'true'); render(); });
      filters.append(b);
    });
    const past = document.getElementById('cal-past');
    if (past) past.addEventListener('click', () => { showPast = !showPast; past.textContent = showPast ? 'Hide past events' : 'Show past events'; render(); });
    render();
  }

  // Home page: next event
  const nx = document.getElementById('next-event');
  if (nx) {
    const today = todayStr();
    const e = events.find((x) => (x.end || x.date) >= today && x.title !== 'Brief');
    if (e) {
      nx.querySelector('h3').textContent = e.title;
      nx.querySelector('p').textContent = dayLabel(e) + ' ' + MONTHS[d(e.date).getMonth()] + (e.time ? ', ' + fmtTime(e.time) : '') + '. ' + CATS[e.cat].label + '.';
    }
  }
})();
