/* Deterministic animation helpers. Every function is a pure mapping from progress p (0..1) to style;
   nothing here reads the clock, so the same t always produces the same frame. */
const cl = (v, a, b) => Math.max(a, Math.min(b, v));
const seg = (t, a, b) => cl((t - a) / (b - a), 0, 1);
const eo = p => 1 - Math.pow(1 - p, 3);                 // ease-out cubic
const eo4 = p => 1 - Math.pow(1 - p, 4);
const ei = p => p * p * p;
const eio = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const bk = p => { const c = 2.70158, s = 1.70158; return 1 + c * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2); };
const expo = p => p >= 1 ? 1 : 1 - Math.pow(2, -10 * p);                                   // snappy ease-out
const spring = p => { p = cl(p, 0, 1); return 1 - Math.pow(1 - p, 2.2) * Math.cos(p * Math.PI * 1.15); }; // light overshoot
const lerp = (a, b, p) => a + (b - a) * p;

function el(id) { return typeof id === 'string' ? document.getElementById(id) : id; }
function st(id, o) { const e = el(id); if (!e) return; for (const k in o) e.style[k] = o[k]; }
function txt(id, s) { const e = el(id); if (e && e.textContent !== s) e.textContent = s; }
function cls(id, name, on) { const e = el(id); if (e) e.classList.toggle(name, !!on); }

/* fade + rise */
function up(id, p, dy) { const e = eo4(p); st(id, { opacity: e, transform: 'translateY(' + ((1 - e) * (dy === undefined ? 34 : dy)) + 'px)' }); }
/* kinetic headline: each .ln/.li line (built by heading()) wipes up inside its mask, then any <em> gets its underline drawn.
   Falls back to a plain rise for headlines without line wrappers. */
function h1In(id, p) {
  const e = el(id); if (!e) return;
  const lines = e.querySelectorAll('.li');
  if (!lines.length) return up(id, p);
  e.style.opacity = p > 0 ? 1 : 0;
  const n = lines.length, step = Math.min(.22, .5 / n);
  lines.forEach((li, i) => { const q = expo(seg(p, i * step, i * step + (1 - step * (n - 1)))); li.style.transform = 'translateY(' + ((1 - q) * 108).toFixed(2) + '%)'; li.style.opacity = cl(q * 2.5, 0, 1); });
  e.style.setProperty('--ul', eo(seg(p, .6, 1)).toFixed(3));
}
/* stagger a group: ids = array of ids or a prefix with count; fx(id, q, arg) is any helper above.
   t: progress, a: first start, step: start-to-start delay, len: each item's length */
function stagger(ids, n, t, a, step, len, fx, arg) {
  const list = Array.isArray(ids) ? ids : Array.from({ length: n }, (_, i) => ids + (i + 1));
  list.forEach((id, i) => fx(id, seg(t, a + i * step, a + i * step + len), arg));
}
/* subtle breathing for a hero element while a slide is held: scale 1 → 1 + amp, period sec */
function idle(sec, amp, period) { return 1 + (amp === undefined ? .012 : amp) * (.5 - .5 * Math.cos(2 * Math.PI * (sec || 0) / (period || 4))); }
/* pop in with a little overshoot */
function pp(id, p, from) { const e = bk(cl(p, 0, 1)), s = (from === undefined ? .82 : from); st(id, { opacity: cl(p * 2.2, 0, 1), transform: 'scale(' + (s + (1 - s) * e) + ')' }); }
/* slide in along x */
function sx(id, p, dx) { const e = eo4(p); st(id, { opacity: e, transform: 'translateX(' + ((1 - e) * dx) + 'px)' }); }
/* plain fade */
function fd(id, p) { st(id, { opacity: cl(p, 0, 1) }); }
/* draw every direct <path> of an svg by stroke-dashoffset */
function draw(id, p) {
  const e = el(id); if (!e) return;
  e.style.opacity = p > 0 ? 1 : 0;
  e.querySelectorAll(':scope > path').forEach(pa => {
    const L = pa.getTotalLength();
    pa.style.strokeDasharray = L + ' ' + L;
    pa.style.strokeDashoffset = L * (1 - eo(p));
    if (pa.dataset.mk === undefined) pa.dataset.mk = pa.getAttribute('marker-end') || '';
    if (pa.dataset.mk) pa.setAttribute('marker-end', p > .93 ? pa.dataset.mk : 'none');
  });
}
/* reveal n code lines (ids prefix1..prefixN) between a and b */
function code(prefix, n, t, a, b) {
  for (let i = 1; i <= n; i++) {
    const w = (b - a) / n;
    const p = seg(t, a + (i - 1) * w * .82, a + (i - 1) * w * .82 + w * 1.5);
    st(prefix + i, { opacity: eo(p), transform: 'translateX(' + ((1 - eo(p)) * 22) + 'px)' });
  }
}
/* grow n bars (ids prefix-b0..) vertically between a and b, staggered */
function bars(prefix, n, t, a, b, stagger) {
  const sg = stagger === undefined ? .55 : stagger;
  for (let i = 0; i < n; i++) {
    const w = (b - a) / (1 + (n - 1) * sg);
    const s = a + i * w * sg;
    const p = eo(seg(t, s, s + w));
    st(prefix + '-b' + i, { transform: 'scaleY(' + p + ')' });
    st(prefix + '-v' + i, { opacity: seg(p, .85, 1) });
  }
}
/* horizontal bar fill */
function fill(id, p) { st(id, { transform: 'scaleX(' + eo(cl(p, 0, 1)) + ')' }); }
/* numeric counter */
function tick(id, p, from, to, fmt) { txt(id, (fmt || (v => Math.round(v)))(lerp(from, to, eo(cl(p, 0, 1))))); }
/* dot ripple */
function ripple(id, p, cx, cy, max) {
  const e = eo(p), r = e * max;
  st(id, { left: (cx - r) + 'px', top: (cy - r) + 'px', width: (2 * r) + 'px', height: (2 * r) + 'px', opacity: p > 0 && p < 1 ? (1 - e) * .8 : 0 });
}
/* pointer: fade in, glide from (x0,y0) to (x1,y1) */
function cursor(id, pIn, pMove, x0, y0, x1, y1) {
  const m = eio(cl(pMove, 0, 1));
  st(id, { opacity: cl(pIn, 0, 1), left: lerp(x0, x1, m) + 'px', top: lerp(y0, y1, m) + 'px' });
}
/* pulse (0..1..0) used for status highlights */
function pulse(p) { return Math.sin(cl(p, 0, 1) * Math.PI); }
/* set a Cloudscape status indicator */
const STATUS_ICON = { ok: 'a-ok', prog: 'a-prog', stop: 'a-stop', neg: 'a-neg', err: 'a-neg', pend: 'a-pend' };
function status(id, text, type) {
  const e = el(id); if (!e) return;
  if (e.dataset.s === text + type) return;
  e.dataset.s = text + type;
  e.className = 'st ' + type;
  e.innerHTML = '<svg viewBox="0 0 24 24"><use href="#' + STATUS_ICON[type] + '"/></svg>' + text;
}
/* fmt helpers (currency from PROJECT.locale.currency, default $) */
const CUR = (window.PROJECT && window.PROJECT.locale && window.PROJECT.locale.currency) || '$';
const money = v => CUR + v.toFixed(2);
const money4 = v => CUR + v.toFixed(4);

/* ---------- motion-graphics vocabulary (pure in their arguments; see skills/new-video/references/design-rules.md) ---------- */
/* one code line: fade + slide from the right, q 0..1 (code() above is the fraction-scheduled group of these) */
function codeLine(id, q) { st(id, { opacity: eo(q), transform: 'translateX(' + ((1 - eo(q)) * 22) + 'px)' }); }
/* de-emphasis: multiply the opacity an fx helper just set for this id (call right after it, every frame); f 0..1, to = final opacity */
function dim(id, f, to) { const e = el(id); if (!e || !(f > 0)) return; const k = 1 - (1 - (to === undefined ? .5 : to)) * eo(cl(f, 0, 1)); e.style.opacity = String(parseFloat(e.style.opacity || '1') * k); }
/* highlight sweep: a light band crossing the element once (CSS ::after driven by --swx); p 0..1, parked off-screen outside (0,1) */
function sweep(id, p) { const e = el(id); if (!e) return; e.style.setProperty('--swx', (p <= 0 || p >= 1 ? -80 : -80 + 260 * p).toFixed(1) + '%'); }
/* masked wipe reveal: dir 'right' (left→right, default), 'left', 'down', 'up' */
function wipe(id, p, dir) {
  const q = ((1 - eo(cl(p, 0, 1))) * 100).toFixed(2), d = dir || 'right';
  st(id, { opacity: p > 0 ? 1 : 0, clipPath: d === 'right' ? 'inset(0 ' + q + '% 0 0)' : d === 'left' ? 'inset(0 0 0 ' + q + '%)' : d === 'down' ? 'inset(0 0 ' + q + '% 0)' : 'inset(' + q + '% 0 0 0)' });
}
/* a connector draws, then its target pops just after the line completes (p 0..1 over the whole sequence) */
function drawPop(lineId, targetId, p) { draw(lineId, seg(p, 0, .7)); pp(targetId, seg(p, .62, 1), .8); }
/* pulse ring around an absolutely positioned element: an expanding, fading ring on a time loop.
   sec = seconds into the hold (< 0 hides it), o: {period (2s), amp (.55), color}. The ring element is created next to the
   target on first use (idempotent), so frames stay a pure function of (u, ctx). */
function ring(id, sec, o) {
  const e = el(id); if (!e) return; o = o || {}; const period = o.period || 2, rid = e.id + '-ring';
  let r = document.getElementById(rid);
  if (!r) { r = document.createElement('div'); r.className = 'ring'; r.id = rid; e.parentNode.insertBefore(r, e.nextSibling); }
  if (!(sec >= 0)) { r.style.opacity = '0'; return; }
  const ph = (sec % period) / period, q = eo(ph);
  st(r, { left: (e.offsetLeft - 6) + 'px', top: (e.offsetTop - 6) + 'px', width: (e.offsetWidth + 12) + 'px', height: (e.offsetHeight + 12) + 'px',
    borderRadius: getComputedStyle(e).borderRadius || '20px', borderColor: o.color || 'currentColor', opacity: String((1 - q) * (o.amp || .8)), transform: "scale(" + (1 + .12 * q).toFixed(4) + ")" });
}
