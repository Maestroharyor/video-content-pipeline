/* ---------- helpers ---------- */
const cl = (v, a, b) => Math.max(a, Math.min(b, v));
const seg = (t, a, b) => cl((t - a) / (b - a), 0, 1);
const eo = p => 1 - Math.pow(1 - p, 3);
const eo4 = p => 1 - Math.pow(1 - p, 4);
const eio = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const bk = p => { const c = 1.70158 + 1, s = 1.70158; return 1 + c * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2); };

function st(id, o) { const e = document.getElementById(id); if (!e) return; for (const k in o) e.style[k] = o[k]; }
function q(sel) { return document.querySelector(sel); }

/* fade + rise */
function up(id, p, dy) {
  const e = eo(p);
  st(id, { opacity: e, transform: 'translateY(' + ((1 - e) * (dy === undefined ? 34 : dy)) + 'px)' });
}
/* pop in */
function pp(id, p, from) {
  const e = bk(cl(p, 0, 1)), s = (from === undefined ? .82 : from);
  st(id, { opacity: cl(p * 2.2, 0, 1), transform: 'scale(' + (s + (1 - s) * e) + ')' });
}
/* slide in from x */
function sx(id, p, dx) {
  const e = eo(p);
  st(id, { opacity: e, transform: 'translateX(' + ((1 - e) * dx) + 'px)' });
}
/* draw an svg path */
function draw(id, p) {
  const el = document.getElementById(id); if (!el) return;
  el.style.opacity = p > 0 ? 1 : 0;
  el.querySelectorAll(':scope > path').forEach(pa => {
    const L = pa.getTotalLength();
    if (!pa.dataset.dash) { pa.dataset.dash = L; }
    pa.style.strokeDasharray = L + ' ' + L;
    pa.style.strokeDashoffset = L * (1 - eo(p));
    if (pa.dataset.mk === undefined) pa.dataset.mk = pa.getAttribute('marker-end') || '';
    if (pa.dataset.mk) pa.setAttribute('marker-end', p > .93 ? pa.dataset.mk : 'none');
  });
}
/* reveal code lines */
function code(prefix, n, t, a, b) {
  for (let i = 1; i <= n; i++) {
    const w = (b - a) / n;
    const p = seg(t, a + (i - 1) * w * .82, a + (i - 1) * w * .82 + w * 1.5);
    st(prefix + i, { opacity: eo(p), transform: 'translateX(' + ((1 - eo(p)) * 22) + 'px)' });
  }
}
/* dot ripple */
function ripple(id, p, cx, cy, max) {
  const e = eo(p), r = e * max;
  st(id, { left: (cx - r) + 'px', top: (cy - r) + 'px', width: (2 * r) + 'px', height: (2 * r) + 'px', opacity: (1 - e) * .8 });
}

/* ---------- one-time DOM construction ---------- */
const MORE = {
  s06: [['i-clock', 'City Transit', 'Travel', '-$2.90', 'dn'],
        ['i-send', 'Emma Larsen', 'Transfer sent', '-$75.00', 'dn'],
        ['i-bag', 'Northside Books', 'Shopping', '-$41.10', 'dn'],
        ['i-clock', 'Standing order', 'Rent', '-$1,450.00', 'dn']],
  s07: [['i-heart', 'Alice Whitmore', 'liked your post', '11h', 'mut'],
        ['i-chat', 'Nathan Cole', 'commented on your photo', '14h', 'mut'],
        ['i-users', 'Grace Turner', 'started following you', '1d', 'mut'],
        ['i-heart', 'Ruth Callahan', 'liked your post', '1d', 'mut']],
  s09: [['i-file', 'Invoice 2839 sent', 'Northwind Ltd', '2d', 'mut'],
        ['i-shield', 'Password changed', 'Security', '3d', 'mut'],
        ['i-users', 'Daniel joined', 'Engineering workspace', '4d', 'mut'],
        ['i-chart', 'Usage report ready', 'July summary', '5d', 'mut']],
};
const MORE_CARDS = {
  s10: [['Leather belt', '$44.00', '#E4F3EC', '#8FBBA6', 'i-tag'],
        ['Travel mug', '$21.00', '#FBEDE4', '#C6A48F', 'i-cart'],
        ['Cotton socks', '$12.00', '#E7EDF7', '#9AACC6', 'i-bag'],
        ['Denim cap', '$27.00', '#EDE9F7', '#A79BC6', 'i-tag']],
};
const DASH_MORE = [
  ['Grace Turner &middot; downloaded an export', 'g', 'Applied', '08:31'],
  ['Nathan Cole &middot; rotated a secret', 'b', 'Reviewed', '08:19'],
  ['Alice Whitmore &middot; removed a member', 'a', 'Pending', '08:02'],
  ['Sarah Mitchell &middot; opened billing', 'g', 'Applied', '07:55'],
];

function rowHTML(r) {
  const cls = r[4] === 'mut' ? 'amt' : 'amt ' + r[4];
  const sty = r[4] === 'mut' ? 'font-size:24px;color:#8894AB' : '';
  return '<div class="trow"><span class="ic"><svg viewBox="0 0 24 24"><use href="#' + r[0] + '"/></svg></span>' +
    '<span class="lb"><span>' + r[1] + '</span><small>' + r[2] + '</small></span>' +
    '<span class="' + cls + '" style="' + sty + '">' + r[3] + '</span></div>';
}
function cardHTML(c) {
  return '<div class="card" style="width:248px;padding:0;overflow:hidden">' +
    '<div style="height:172px;background:' + c[2] + ';display:grid;place-items:center">' +
    '<svg style="width:56px;height:56px;fill:none;stroke:' + c[3] + ';stroke-width:1.6" viewBox="0 0 24 24"><use href="#' + c[4] + '"/></svg></div>' +
    '<div style="padding:14px 16px"><b style="display:block;font:700 26px Inter;color:#0F1729">' + c[0] + '</b>' +
    '<i style="display:block;font-style:normal;font:600 25px Inter;color:#5A6780;margin-top:5px">' + c[1] + '</i></div></div>';
}

function buildAll() {
  const shown = [...document.querySelectorAll('.slide')];
  shown.forEach(e => e.classList.add('on'));   /* layout must be live to measure */

  /* wrap each phone body in a scroller and append the "next page" rows */
  ['s06', 's07', 's09', 's10'].forEach(id => {
    const body = q('#' + id + ' .body'); if (!body || body.dataset.done) return;
    /* header (title, subtitle, section label) stays pinned; only the list scrolls */
    const kids = [...body.children];
    const firstIdx = kids.findIndex(e => e.classList.contains('trow') || e.id === 'j-grid');
    const vp = document.createElement('div');
    vp.className = 'vp'; vp.style.cssText = 'position:relative;overflow:hidden';
    const sc = document.createElement('div');
    sc.className = 'sc'; sc.id = id + '-sc';
    sc.style.cssText = 'position:relative;will-change:transform';
    kids.slice(firstIdx).forEach(e => sc.appendChild(e));
    vp.appendChild(sc); body.appendChild(vp); body.dataset.done = '1';
    const tab = q('#' + id + ' .tabbar');
    /* .body is itself positioned, so vp.offsetTop is body-relative while tab.offsetTop is screen-relative */
    vp.style.height = Math.max(200, tab.offsetTop - (vp.offsetTop + body.offsetTop) - 10) + 'px';

    const holder = document.createElement('div');
    holder.id = id + '-more';
    if (MORE_CARDS[id]) {
      const grid = q('#' + id + ' #j-grid');
      MORE_CARDS[id].forEach((c, i) => {
        const d = document.createElement('div'); d.innerHTML = cardHTML(c);
        const n = d.firstChild; n.id = id + '-m' + (i + 1); n.style.opacity = 0; grid.appendChild(n);
      });
    } else {
      MORE[id].forEach((r, i) => {
        const d = document.createElement('div'); d.innerHTML = rowHTML(r);
        const n = d.firstChild; n.id = id + '-m' + (i + 1); n.style.opacity = 0; holder.appendChild(n);
      });
      sc.appendChild(holder);
    }
  });

  /* dashboard: viewport + scroller around the rows, plus a next page of events */
  const tbl = q('#s08 .dtbl');
  if (tbl && !tbl.dataset.done) {
    const vp = document.createElement('div');
    vp.style.cssText = 'height:378px;overflow:hidden;position:relative';
    const sc = document.createElement('div'); sc.id = 'h-sc'; sc.style.cssText = 'position:relative;will-change:transform';
    tbl.querySelectorAll('.dtr').forEach(r => sc.appendChild(r));
    DASH_MORE.forEach((r, i) => {
      const d = document.createElement('div');
      d.className = 'dtr'; d.id = 'h-m' + (i + 1); d.style.opacity = 0;
      d.innerHTML = '<span class="c1">' + r[0] + '</span><span class="c2"><span class="stp ' + r[1] + '">' + r[2] + '</span></span><span class="c3">' + r[3] + '</span>';
      sc.appendChild(d);
    });
    vp.appendChild(sc); tbl.appendChild(vp); tbl.dataset.done = '1';
  }

  /* s15 scan bars */
  const mk = (host, n) => {
    const h = document.getElementById(host); if (!h || h.dataset.done) return;
    for (let i = 0; i < n; i++) {
      const d = document.createElement('i');
      d.id = host + '-b' + i;
      d.style.cssText = 'position:absolute;left:0;width:416px;height:30px;border-radius:8px;background:#1B2537;top:' + (i * 36) + 'px;opacity:0';
      h.appendChild(d);
    }
    h.dataset.done = '1';
  };
  mk('o-scan', 13); mk('o-seek', 13);

  /* now that every row exists, record how far each list has to travel */
  window.DY = {};
  ['s06', 's07', 's09', 's10'].forEach(id => {
    const vp = q('#' + id + ' .vp'), sc = document.getElementById(id + '-sc');
    if (vp && sc) window.DY[id] = Math.max(0, sc.scrollHeight - vp.clientHeight + 20);
  });
  const dsc = document.getElementById('h-sc');
  if (dsc) {
    const rh = dsc.querySelector('.dtr').offsetHeight;
    dsc.parentElement.style.height = (rh * 6) + 'px';
    window.DY.s08 = Math.max(0, dsc.scrollHeight - rh * 6);
  }
  shown.forEach(e => e.classList.remove('on'));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildAll); else buildAll();

/* ---------- shared: example-slide phone animation ---------- */
function exampleSlide(id, p, opt) {
  const rows = opt.rows, loadId = opt.load, curId = opt.cur, accent = opt.accent;
  up(opt.dev, seg(p, 0, .16), 70);
  rows.forEach((r, i) => {
    const a = .14 + i * .038;
    up(r, seg(p, a, a + .16), 26);
  });
  /* loading indicator */
  const lp = seg(p, .38, .46) * (1 - seg(p, .56, .64));
  st(loadId, { opacity: lp });
  const sp = document.querySelector('#' + loadId + ' .spin');
  if (sp) sp.style.transform = 'rotate(' + (p * 1900) + 'deg)';
  /* scroll + append */
  const s = eio(seg(p, .56, .84));
  const dy = (window.DY && window.DY[id] !== undefined) ? window.DY[id] : opt.dy;
  st(id + '-sc', { transform: 'translateY(' + (-dy * s) + 'px)' });
  const n = (MORE_CARDS[id] || MORE[id]).length;
  for (let i = 1; i <= n; i++) {
    const a = .62 + (i - 1) * .045;
    up(id + '-m' + i, seg(p, a, a + .18), 26);
  }
  pp(curId, seg(p, .84, .94), .84);
  up(opt.foot, seg(p, .88, .98));
  up(opt.eb, seg(p, .02, .14)); up(opt.h1, seg(p, .05, .20));
}

/* ---------- per-slide frames ---------- */
const S = {};

S.s01 = t => {
  up('a-eb', seg(t, .02, .14)); up('a-h1', seg(t, .06, .22));
  ['a-r1', 'a-r2', 'a-r3', 'a-r4'].forEach((id, i) => up(id, seg(t, .20 + i * .045, .36 + i * .045), 26));
  draw('a-line', seg(t, .42, .58));
  pp('a-cur', seg(t, .54, .66), .8);
  ['a-r5', 'a-r6', 'a-r7'].forEach((id, i) => {
    const p = seg(t, .64 + i * .04, .78 + i * .04);
    st(id, { opacity: eo(p) * .42, transform: 'translateY(' + ((1 - eo(p)) * 26) + 'px)' });
  });
  up('a-nx', seg(t, .80, .92));
  up('a-ft', seg(t, .86, .98));
};

S.s02 = t => {
  up('b-eb', seg(t, .02, .14)); up('b-h1', seg(t, .05, .20));
  up('b-dev', seg(t, .08, .26), 70);
  ['b-t1', 'b-t2', 'b-t3', 'b-t4', 'b-t5', 'b-t6'].forEach((id, i) => up(id, seg(t, .18 + i * .035, .34 + i * .035), 26));
  pp('b-b1', seg(t, .42, .52), .82); up('b-s1', seg(t, .46, .58));
  pp('b-b2', seg(t, .58, .68), .82); up('b-s2', seg(t, .62, .74));
  pp('b-b3', seg(t, .74, .84), .82); up('b-s3', seg(t, .78, .90));
  up('b-ft', seg(t, .88, .98));
};

S.s03 = t => {
  up('c-eb', seg(t, .02, .14)); up('c-h1', seg(t, .05, .20));
  pp('c-app', seg(t, .12, .24), .88); pp('c-api', seg(t, .16, .28), .88);
  draw('c-a1', seg(t, .26, .38));
  pp('c-q1', seg(t, .32, .42), .84);
  draw('c-a2', seg(t, .42, .54));
  code('c-l', 5, t, .48, .74);
  st('c-code', { opacity: eo(seg(t, .44, .54)) });
  up('c-note', seg(t, .70, .82));
  up('c-p1', seg(t, .80, .90), 24); up('c-p2', seg(t, .84, .94), 24);
  draw('c-a3', seg(t, .88, .96));
  up('c-ft', seg(t, .90, 1));
};

S.s04 = t => {
  up('d-eb', seg(t, .02, .14)); up('d-h1', seg(t, .05, .20));
  sx('d-c1', seg(t, .16, .34), -60); sx('d-c2', seg(t, .22, .40), 60);
  up('d-s', seg(t, .42, .54));
  pp('d-x1', seg(t, .54, .64), .8); pp('d-x2', seg(t, .60, .70), .8); pp('d-x3', seg(t, .66, .76), .8);
  pp('d-win', seg(t, .78, .90), .9);
  up('d-ft', seg(t, .88, .98));
};

S.s05 = t => {
  up('e-eb', seg(t, .02, .14)); up('e-h1', seg(t, .05, .20));
  ['e-g1', 'e-g2', 'e-g3', 'e-g4', 'e-g5'].forEach((id, i) => sx(id, seg(t, .18 + i * .085, .38 + i * .085), -48));
  up('e-note', seg(t, .74, .88));
  up('e-ft', seg(t, .86, .98));
};

S.s06 = t => exampleSlide('s06', t, {
  dev: 'f-dev', eb: 'f-eb', h1: 'f-h1', foot: 'f-ft', load: 'f-load', cur: 'f-cur', dy: 352,
  rows: ['f-t1', 'f-t2', 'f-t3', 'f-t4', 'f-t5', 'f-t6']
});
S.s07 = t => exampleSlide('s07', t, {
  dev: 'g-dev', eb: 'g-eb', h1: 'g-h1', foot: 'g-ft', load: 'g-load', cur: 'g-cur', dy: 352,
  rows: ['g-t1', 'g-t2', 'g-t3', 'g-t4', 'g-t5', 'g-t6']
});
S.s09 = t => exampleSlide('s09', t, {
  dev: 'i-dev', eb: 'i-eb', h1: 'i-h1', foot: 'i-ft', load: 'i-load', cur: 'i-cur', dy: 352,
  rows: ['i-t1', 'i-t2', 'i-t3', 'i-t4', 'i-t5', 'i-t6']
});
S.s10 = t => exampleSlide('s10', t, {
  dev: 'j-dev', eb: 'j-eb', h1: 'j-h1', foot: 'j-ft', load: 'j-load', cur: 'j-cur', dy: 340,
  rows: ['j-p1', 'j-p2', 'j-p3', 'j-p4', 'j-p5', 'j-p6']
});

S.s08 = t => {
  up('h-eb', seg(t, .02, .14)); up('h-h1', seg(t, .05, .20));
  up('h-dash', seg(t, .08, .26), 60);
  ['h-r1', 'h-r2', 'h-r3', 'h-r4', 'h-r5', 'h-r6', 'h-r7'].forEach((id, i) => up(id, seg(t, .18 + i * .032, .32 + i * .032), 20));
  /* cursor drifts to the bottom of the table, then the next page loads */
  const cp = eio(seg(t, .44, .62));
  st('h-cur', { opacity: eo(seg(t, .42, .50)), left: (600 - cp * 190) + 'px', top: (170 + cp * 250) + 'px' });
  const s = eio(seg(t, .60, .84));
  st('h-sc', { transform: 'translateY(' + (-(window.DY.s08 || 212) * s) + 'px)' });
  [1, 2, 3, 4].forEach(i => up('h-m' + i, seg(t, .64 + (i - 1) * .04, .80 + (i - 1) * .04), 18));
  const tp = seg(t, .72, .80) * (1 - seg(t, .94, 1));
  st('h-toast', { opacity: eo(tp), transform: 'translateY(' + ((1 - eo(seg(t, .72, .80))) * 26) + 'px)' });
  pp('h-cb', seg(t, .82, .92), .84);
  up('h-s', seg(t, .86, .96));
  up('h-ft', seg(t, .90, 1));
};

S.s11 = t => {
  up('k-eb', seg(t, .02, .14)); up('k-h1', seg(t, .05, .20));
  pp('k-p1', seg(t, .18, .30), .88); pp('k-p2', seg(t, .26, .38), .88);
  pp('k-p3', seg(t, .34, .46), .88); pp('k-p4', seg(t, .48, .62), .86);
  const g = seg(t, .62, .76);
  st('k-p4', { boxShadow: '0 0 ' + (g * 60) + 'px rgba(45,212,191,' + (g * .30) + ')' });
  up('k-s', seg(t, .72, .86));
  up('k-ft', seg(t, .86, .98));
};

S.s12 = t => {
  up('l-eb', seg(t, .02, .14)); up('l-h1', seg(t, .05, .20));
  sx('l-c1', seg(t, .16, .34), -60); sx('l-c2', seg(t, .22, .40), 60);
  draw('l-a', seg(t, .44, .62));
  up('l-note', seg(t, .62, .76));
  up('l-s', seg(t, .78, .90));
  up('l-ft', seg(t, .88, .98));
};

S.s13 = t => {
  up('m-eb', seg(t, .02, .14)); up('m-h1', seg(t, .05, .20));
  ['m-s1', 'm-s2', 'm-s3', 'm-s4'].forEach((id, i) => sx(id, seg(t, .18 + i * .09, .38 + i * .09), -50));
  draw('m-loop', seg(t, .58, .74));
  pp('m-lp', seg(t, .70, .80), .8);
  up('m-note', seg(t, .80, .92));
  up('m-ft', seg(t, .88, .98));
};

S.s14 = t => {
  up('n-eb', seg(t, .02, .14)); up('n-h1', seg(t, .05, .20));
  up('n-dev', seg(t, .08, .26), 70);
  up('n-lbl', seg(t, .22, .34));
  /* the list scrolls continuously; the position label counts up */
  const s = eio(seg(t, .24, .92));
  st('n-scr', { transform: 'translateY(' + (-s * 700) + 'px)' });
  const e = document.getElementById('n-pos');
  if (e) { const from = 1 + Math.round(s * 9980); e.textContent = 'Showing ' + from.toLocaleString() + '\u2013' + (from + 19).toLocaleString(); }
  pp('n-m1', seg(t, .32, .42), .84);
  pp('n-m2', seg(t, .46, .56), .84);
  pp('n-m3', seg(t, .60, .70), .84);
  pp('n-m4', seg(t, .74, .84), .84);
  up('n-flat', seg(t, .84, .94));
  up('n-ft', seg(t, .88, .98));
};

S.s15 = t => {
  up('o-eb', seg(t, .02, .14)); up('o-h1', seg(t, .05, .20));
  pp('o-hl', seg(t, .14, .24), .84); pp('o-hr', seg(t, .18, .28), .84);
  pp('o-bl', seg(t, .16, .28), .92); pp('o-br', seg(t, .20, .32), .92);
  /* offset: sweeps through every bar, slowly */
  for (let i = 0; i < 13; i++) {
    const a = .30 + i * .034;
    const p = seg(t, a, a + .06);
    const on = i >= 10 ? seg(t, .72, .78) : 0;
    const bg = on > .3 ? '#14312e' : (p > .5 ? '#3A1B26' : '#202C42');
    st('o-scan-b' + i, { opacity: eo(seg(t, .26 + i * .008, .34 + i * .008)), background: bg,
      boxShadow: on > .3 ? '0 0 26px rgba(45,212,191,.45)' : (p > .2 && p < 1 ? '0 0 24px rgba(251,113,133,.5)' : 'none') });
  }
  /* cursor: bars appear, then it seeks straight to the target band */
  for (let i = 0; i < 13; i++) {
    const isT = i >= 10;
    const p = isT ? seg(t, .36, .46) : 0;
    st('o-seek-b' + i, { opacity: eo(seg(t, .26 + i * .008, .34 + i * .008)) * (isT ? 1 : .8),
      background: p > .5 ? '#14312e' : '#202C42',
      boxShadow: p > .5 ? '0 0 26px rgba(45,212,191,.45)' : 'none' });
  }
  pp('o-cr', seg(t, .48, .58), .84);
  pp('o-cl', seg(t, .76, .86), .84);
  pp('o-t2', seg(t, .54, .64), .8);
  pp('o-t1', seg(t, .80, .90), .8);
  up('o-s', seg(t, .86, .96));
  up('o-ft', seg(t, .90, 1));
};

S.s16 = t => {
  up('p-eb', seg(t, .02, .14)); up('p-h1', seg(t, .05, .20));
  up('p-new', seg(t, .14, .28));
  pp('p-hl', seg(t, .26, .36), .84); pp('p-hr', seg(t, .30, .40), .84);
  ['p-l1', 'p-l2', 'p-l3', 'p-l4'].forEach((id, i) => sx(id, seg(t, .36 + i * .05, .52 + i * .05), -40));
  ['p-r1', 'p-r2', 'p-r3', 'p-r4'].forEach((id, i) => sx(id, seg(t, .40 + i * .05, .56 + i * .05), 40));
  /* flash the two bad rows */
  const f = Math.sin(cl(seg(t, .62, .82), 0, 1) * Math.PI * 3);
  const gl = f > 0 ? f * .55 : 0;
  st('p-l1', { boxShadow: '0 0 34px rgba(251,113,133,' + gl + ')' });
  st('p-l4', { boxShadow: '0 0 34px rgba(251,113,133,' + gl + ')' });
  pp('p-bl', seg(t, .74, .84), .84); pp('p-br', seg(t, .78, .88), .84);
  up('p-s', seg(t, .84, .95));
  up('p-ft', seg(t, .90, 1));
};

S.s17 = t => {
  up('q-eb', seg(t, .02, .14)); up('q-h1', seg(t, .05, .20));
  pp('q-g1', seg(t, .14, .26), .78); pp('q-g2', seg(t, .19, .31), .78); pp('q-g3', seg(t, .24, .36), .78);
  st('q-code', { opacity: eo(seg(t, .32, .42)), transform: 'translateY(' + ((1 - eo(seg(t, .32, .42))) * 28) + 'px)' });
  code('q-l', 8, t, .36, .78);
  up('q-note', seg(t, .80, .92));
  up('q-ft', seg(t, .88, .98));
};

S.s18 = t => {
  up('r-eb', seg(t, .02, .14)); up('r-h1', seg(t, .05, .20));
  pp('r-g1', seg(t, .14, .26), .78); pp('r-g2', seg(t, .19, .31), .78);
  st('r-code', { opacity: eo(seg(t, .30, .40)), transform: 'translateY(' + ((1 - eo(seg(t, .30, .40))) * 28) + 'px)' });
  code('r-l', 9, t, .34, .78);
  up('r-note', seg(t, .80, .92));
  up('r-ft', seg(t, .88, .98));
};

S.s19 = t => {
  up('t-eb', seg(t, .02, .14)); up('t-h1', seg(t, .05, .20));
  pp('t-g1', seg(t, .14, .26), .78); pp('t-g2', seg(t, .19, .31), .78);
  st('t-code', { opacity: eo(seg(t, .28, .38)), transform: 'translateY(' + ((1 - eo(seg(t, .28, .38))) * 28) + 'px)' });
  code('t-l', 6, t, .32, .64);
  sx('t-s1', seg(t, .64, .78), -46); sx('t-s2', seg(t, .70, .84), -46);
  up('t-note', seg(t, .82, .94));
  up('t-ft', seg(t, .88, .98));
};

S.s20 = t => {
  up('u-eb', seg(t, .02, .14)); up('u-h1', seg(t, .05, .22));
  const beats = [.30, .42, .54, .66];
  ['u-h-ig', 'u-h-x', 'u-h-li', 'u-h-tt'].forEach((id, i) => {
    const p = seg(t, beats[i], beats[i] + .10);
    const e = bk(p);
    st(id, { opacity: cl(p * 2.4, 0, 1), transform: 'translateX(' + ((1 - eo(p)) * -40) + 'px) scale(' + (.80 + .20 * e) + ')' });
  });
  draw('u-div', seg(t, .70, .80));
  up('u-box', seg(t, .78, .90), 40);
  const sp = seg(t, .86, 1);
  st('u-shim', { opacity: sp > 0 && sp < 1 ? 1 : 0, transform: 'translateX(' + (sp * 1320) + 'px)' });
  up('u-ft', seg(t, .90, 1));
};

const IDS = Object.keys(S).sort();
window.SLIDE_IDS = IDS;
window.setFrame = function (id, t) {
  document.querySelectorAll('.slide').forEach(s => s.classList.remove('on'));
  const el = document.getElementById(id); if (!el) throw new Error('no slide ' + id);
  el.classList.add('on');
  S[id](cl(t, 0, 1));
};
