// Renders the season calendar into the static HTML (so search engines and
// visitors without JavaScript see real dates). Source of truth: js/events.js.
// Run from the site folder:  node scripts/render-calendar.js
// Re-run it (and re-upload index.html + events.html) whenever dates change.
const fs = require('fs');
const src = fs.readFileSync('js/events.js', 'utf8');
const raw = [...src.slice(src.indexOf('const RAW = ['), src.indexOf('];', src.indexOf('const RAW = [')))
  .matchAll(/'([^']*)'/g)].map((m) => m[1]);
const CATS = {};
for (const m of src.matchAll(/(\w+): \{ label: '([^']*)', cls: '([^']*)' \}/g)) CATS[m[1]] = { label: m[2], cls: m[3] };
const events = raw.map((r) => { const p = r.split('|'); return { date: p[0], time: p[1], cat: p[2], title: p[3], end: p[4] || '' }; });

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const d = (s) => { const [y, m, dd] = s.split('-').map(Number); return new Date(y, m - 1, dd); };
const ordinal = (n) => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');
const fmtTime = (t) => (t ? t.replace(/(\d{4})/g, '$1h') : '');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date());
const dayLabel = (e) => {
  const a = d(e.date);
  if (e.end) { const b = d(e.end); return ordinal(a.getDate()) + ' to ' + ordinal(b.getDate()) + ' ' + MONTHS[b.getMonth()].slice(0, 3); }
  return DAYS[a.getDay()].slice(0, 3) + ' ' + ordinal(a.getDate());
};

// events.html season list
const byMonth = {};
events.forEach((e) => { (byMonth[e.date.slice(0, 7)] = byMonth[e.date.slice(0, 7)] || []).push(e); });
const list = Object.keys(byMonth).sort().map((k) => {
  const [y, m] = k.split('-').map(Number);
  const rows = byMonth[k].map((e) => {
    const past = (e.end || e.date) < today;
    return `<div class="cal-row ${CATS[e.cat].cls}${past ? ' past' : ''}"><span class="cal-day"><time datetime="${e.date}">${dayLabel(e)}</time></span><span class="cal-what"><strong>${esc(e.title)}</strong></span><span class="cal-time">${fmtTime(e.time)}</span></div>`;
  }).join('');
  return `<div class="cal-month"><h3>${MONTHS[m - 1]} ${y}</h3>${rows}</div>`;
}).join('\n');

// home page next event (same wording the page script produces)
const e = events.find((x) => (x.end || x.date) >= today && x.title !== 'Brief');
const a = e && d(e.date);
const nextDate = !e ? '' : e.end
  ? (d(e.end).getMonth() === a.getMonth()
    ? ordinal(a.getDate()) + ' to ' + ordinal(d(e.end).getDate()) + ' ' + MONTHS[a.getMonth()]
    : ordinal(a.getDate()) + ' ' + MONTHS[a.getMonth()].slice(0, 3) + ' to ' + ordinal(d(e.end).getDate()) + ' ' + MONTHS[d(e.end).getMonth()].slice(0, 3))
  : DAYS[a.getDay()].slice(0, 3) + ' ' + ordinal(a.getDate()) + ' ' + MONTHS[a.getMonth()];
const next = e
  ? `<div><div class="eyebrow">Next on the calendar</div><h3 style="margin-bottom:6px;">${esc(e.title)}</h3><p style="margin:0;"><time datetime="${e.date}">${nextDate}</time>${e.time ? ', ' + fmtTime(e.time) : ''}. ${esc(CATS[e.cat].label)}.</p></div>`
  : `<div><div class="eyebrow">Next on the calendar</div><h3 style="margin-bottom:6px;">See the season calendar</h3><p style="margin:0;">Competition, tournament and meeting dates are on the Events page.</p></div>`;

function inject(file, marker, html) {
  let s = fs.readFileSync(file, 'utf8');
  const re = new RegExp(`(<!-- ${marker}:START -->)[\\s\\S]*?(<!-- ${marker}:END -->)`);
  if (!re.test(s)) throw new Error(`${file}: marker ${marker} missing`);
  fs.writeFileSync(file, s.replace(re, (_, a2, b2) => a2 + html + b2));
}
inject('events.html', 'CAL:LIST', list);
inject('index.html', 'CAL:NEXT', next);
console.log('Rendered', events.length, 'events; next =', e ? e.title + ' ' + e.date : 'none', '(today ' + today + ')');
