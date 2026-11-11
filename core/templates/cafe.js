/* cafe: the scene engine of the café-counter look (core/styles/cafe.css, built for projects/kafka-vs-rabbitmq).
   A queue is a line of cups on a counter rail, a stream is the register's receipt tape with readers' bookmarks clipped
   on it, so every slide is one declarative scene: items placed in a world box under the heading, each entering on its
   own spoken word, moving, swapping text, changing state or leaving on later words. Neighbouring slides that share a
   scene repeat its items with `pre: true` and `xf: 'cut'`, so the counter reads as one canvas the story returns to.

   data: {eyebrow, accent, h1, w? (1540), h? (600), items: [item], edges?: [edge], sub?}
   item: {id, k, x, y, w?, h?,
          b?        entrance beat (default: the id); at? fraction fallback 0..1 when the row has no beat for it
          fx?       'up' | 'pop' | 'sx' | 'sxr' | 'fd' | 'drop' | 'stamp' (default by kind)
          pre?      on screen from the first frame (a scene carried over a cut)
          moves?    [{b, x?, y?, s?, r?, o?, d?}]  pose changes on later beats, applied in order (d = seconds, .6)
          out?      {b, dx?, dy?}                  leaves (slides away and fades) on a beat
          dim?      beat name                      de-emphasised to .45 from that beat
          on?       [{b, cls}]                     a state class switched on at that beat (red, hot, idle, ok …)
          swap?     {b, html}                      the label is replaced in place at that beat
          count?    {b, from, to, fmt?:'comma'}    the item's number ticks on that beat
          type?     {b, cps?}                      code/term lines type character by character from that beat
          r?        resting rotation (deg); z? stacking; cls? accent/state classes
          kind fields:
            card  {label, sub?, icon?, logo?, img?, who?, tag?}   oat card with a mark, a photo or a person
            photo {src, cap?}                                      a CC photo pinned like a print (passet path)
            cup   {label?, cls?: 'hot'|'cold'|'blue'}               a takeaway cup with the name in marker
            tile  {label, sub?}                                    a message / event slip
            logo  {logo, label?}                                   a brand mark on a white tile
            who   {src, name?}                                     a character (avatars/<role>-<gesture>.svg)
            chip  {html, icon?, logo?}                             a pill
            stamp {html}                                           a rubber stamp
            txt   {html}                                           free text (chalk / ink / big number)
            tape  {}                                               a strip of receipt paper (backdrop)
            bm    {label}                                          a bookmark clip
            bar   {v}                                              a bar that grows to v (0..1) of its height
            code  {title, lines:[[[cls, text], …] | string]}       a VS Code editor (Dark Modern)
            term  {title, lines:[same]}                            a terminal; lines starting with '$ ' are commands
            html  {html}                                           raw markup (a rebuilt UI)}
   edge: {id, a, z?: item ids or [x, y] points, b?, cls?, bend?, dash?, arrow?, flow?}  drawn on its beat
   Beat names a slide can target: every item's b / moves[].b / out.b / dim / on[].b / swap.b / count.b / type.b and
   every edge's b (or id). Time is c.local throughout: frame() is a pure function of (u, c). */
(function () {
  const ENTER_FX = { card: 'up', photo: 'drop', cup: 'drop', tile: 'pop', logo: 'pop', who: 'up', chip: 'pop', stamp: 'stamp',
    txt: 'up', tape: 'fd', bm: 'drop', bar: 'fd', code: 'up', term: 'up', html: 'up' };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  /* a few line symbols core/icons.js does not carry (Lucide-style, stroke only), as c-* */
  const SYM = {
    mail: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="m3 7 9 6 9-6"/>',
    box: '<path d="m12 2.5 8.5 4.8v9.4L12 21.5l-8.5-4.8V7.3z"/><path d="M3.5 7.3 12 12l8.5-4.7M12 12v9.5"/>',
    shield: '<path d="M12 2.5 20 6v6c0 4.6-3.4 8.3-8 9.5-4.6-1.2-8-4.9-8-9.5V6z"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/>',
    archive: '<rect x="2.5" y="3.5" width="19" height="5" rx="1.5"/><path d="M4.5 8.5v11h15v-11M10 12.5h4"/>',
    code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5"/>',
    app: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M3 8.5h18"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M10.5 18.5h3"/>',
    repeat: '<path d="M17 2.5 20.5 6 17 9.5"/><path d="M3.5 11.5V10a4 4 0 0 1 4-4h13M7 21.5 3.5 18 7 14.5"/><path d="M20.5 12.5V14a4 4 0 0 1-4 4h-13"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    chart: '<path d="M3.5 3.5v17h17"/><path d="M7.5 15.5v-4M12 15.5v-8M16.5 15.5v-6"/>',
  };
  if (!document.getElementById('cf-sprite')) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'cf-sprite'; svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
    svg.innerHTML = Object.keys(SYM).map(k => `<symbol id="c-${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${SYM[k]}</symbol>`).join('');
    (document.body || document.documentElement).insertBefore(svg, (document.body || document.documentElement).firstChild);
  }
  const icon = n => `<svg viewBox="0 0 24 24"><use href="#${/^[dic]-/.test(n) ? n : 'i-' + n}"/></svg>`;
  /* code lines → token arrays; a plain string is one token */
  const toks = ln => typeof ln === 'string' ? [['', ln]] : ln;
  const lineLen = ln => toks(ln).reduce((n, t) => n + t[1].length, 0);
  function typed(lines, n, prompt) {
    let left = n;
    return lines.map((ln, i) => {
      let out = '';
      for (const [k, s] of toks(ln)) {
        if (left <= 0) break;
        const part = s.slice(0, left); left -= part.length;
        out += k ? `<span class="${k}">${esc(part)}</span>` : esc(part);
      }
      return `<div class="ln"><i>${prompt ? '' : i + 1}</i><span>${out}</span></div>`;
    }).join('');
  }
  function cup(it) {
    return `<svg viewBox="0 0 100 130" class="cupsvg"><path class="lid" d="M10 18h80l-4 12H14z"/><rect class="lid2" x="16" y="8" width="68" height="12" rx="5"/>
      <path class="body" d="M16 30h68l-9 94H25z"/><path class="slv" d="M19 58h62l-3.4 34H22.4z"/></svg>
      ${it.label ? `<span class="nm">${it.label}</span>` : ''}`;
  }
  function inner(it, p) {
    const lab = v => v != null ? v : '';
    const sw = it.swap ? `<span class="s1">${lab(it.label || it.html)}</span><span class="s2">${it.swap.html}</span>` : lab(it.label || it.html);
    switch (it.k) {
      case 'card': return `${it.logo ? `<span class="mk"><img src="${logo(it.logo, true)}" alt=""></span>` : ''}${it.icon ? `<span class="ic">${icon(it.icon)}</span>` : ''}`
        + `${it.img ? `<img class="ph" src="${it.img}" alt="">` : ''}${it.who ? `<img class="wh" src="${it.who}" alt="">` : ''}`
        + `<span class="tx"><b>${sw}</b>${it.sub ? `<small>${it.sub}</small>` : ''}${it.tag ? `<span class="tg">${it.tag}</span>` : ''}</span>`;
      case 'photo': return `<img src="${it.src}" alt="">${it.cap ? `<span class="cap">${it.cap}</span>` : ''}`;
      case 'cup': return cup(it);
      case 'tile': return `<b>${sw}</b>${it.sub ? `<small>${it.sub}</small>` : ''}`;
      case 'logo': return `<span class="mk"><img src="${logo(it.logo, true)}" alt="${it.label || ''}"></span>${it.label ? `<b>${it.label}</b>` : ''}`;
      case 'who': return `<img src="${it.src}" alt="">${it.name ? `<span class="nm">${it.name}</span>` : ''}`;
      case 'chip': return `${it.logo ? `<img src="${logo(it.logo, true)}" alt="">` : ''}${it.icon ? icon(it.icon) : ''}<span>${sw}</span>`;
      case 'stamp': case 'txt': return it.count ? `<span class="n" id="${p}${it.id}-n">${it.count.from}</span>${it.html ? `<span>${it.html}</span>` : ''}` : sw;
      case 'bm': return `<span>${it.label || ''}</span>`;
      case 'bar': return `<i id="${p}${it.id}-f"></i>${it.label ? `<b>${it.label}</b>` : ''}`;
      case 'code': case 'term': return `<div class="tb"><i></i><i></i><i></i><span>${it.title || ''}</span></div><div class="bd" id="${p}${it.id}-bd">${typed(it.lines, it.type ? 0 : 1e9, it.k === 'term')}</div>`;
      case 'html': return it.html;
      case 'bubble': return `<span>${it.html}</span>`;
      case 'row': return '';
      case 'sub': return SUB.html(p, { x: 0, y: 0, k: it.kk || 1, name: it.name || 'LifeTechFacts', handle: it.handle || '@lifetechfacts' });
      default: return '';
    }
  }
  function nameOf(it) { return it.b || it.id; }
  function cfBeats(d) {
    const n = ['em', 'foot', 'sub'];
    (d.items || []).forEach(it => {
      n.push(nameOf(it)); (it.moves || []).forEach(m => n.push(m.b)); if (it.out) n.push(it.out.b); if (it.dim) n.push(it.dim);
      (it.on || []).forEach(o => { n.push(o.b); if (o.until) n.push(o.until); }); (it.states || []).forEach(o => n.push(o.b)); ['swap', 'count', 'type', 'reveal', 'press'].forEach(k => it[k] && n.push(it[k].b));
    });
    (d.edges || []).forEach(e => n.push(e.b || e.id));
    return Array.from(new Set(n.filter(Boolean)));
  }
  function center(d, ref) {
    if (Array.isArray(ref)) return { x: ref[0], y: ref[1] };
    const it = d.items.find(i => i.id === ref);
    if (!it) throw new Error('cafe: edge end "' + ref + '" is not an item');
    return { x: it.x + (it.w || 0) / 2, y: it.y + (it.h || 0) / 2 };
  }
  function edgePath(d, e) {
    const a = center(d, e.a), z = center(d, e.z), bend = e.bend || 0;
    const mx = (a.x + z.x) / 2, my = (a.y + z.y) / 2, dx = z.x - a.x, dy = z.y - a.y, L = Math.hypot(dx, dy) || 1;
    const cx = mx - dy / L * bend, cy = my + dx / L * bend;
    return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${z.x.toFixed(1)} ${z.y.toFixed(1)}`;
  }
  defineTemplate('cafe', {
    /* data.v.pos (the 9:16 canvas): {itemId: {x, y, w, h, moves, html, cls, …}} laid over each item, so a portrait scene
       restates only where things go and keeps every id and beat (core/registry.js has already merged data.v) */
    check: d => {
      req(d, ['eyebrow', 'h1', 'items'], 'cafe');
      if (d.pos) { const pos = d.pos; delete d.pos; d.items = d.items.map(it => pos[it.id] ? Object.assign({}, it, pos[it.id]) : it); }
    },
    beats: d => cfBeats(d),
    html: (d, c) => {
      const p = c.p, W = d.w || 1540, H = d.h || 600;
      const ids = {};
      d.items.forEach(it => { if (ids[it.id]) throw new Error('cafe: duplicate item id ' + it.id); ids[it.id] = 1; });
      const edges = (d.edges || []).map(e => `<path id="${p}${e.id}" class="cf-edge ${e.cls || ''}${e.dash || e.flow ? ' dash' : ''}" d="${edgePath(d, e)}"${e.arrow !== false ? ` marker-end="url(#${p}ah)"` : ''}/>`).join('');
      const one = it => {
        const box = it.row ? (it.w ? 'width:' + it.w + 'px' : '') : `left:${it.x}px;top:${it.y}px${it.w ? ';width:' + it.w + 'px' : ''}${it.h ? ';height:' + it.h + 'px' : ''}${it.z != null ? ';z-index:' + it.z : ''}`;
        const kids = it.k === 'row' ? d.items.filter(k => k.row === it.id).map(one).join('') : '';
        const gap = it.k === 'row' ? `;gap:${it.gap != null ? it.gap : 28}px${it.w ? ';justify-content:' + (it.justify || 'space-between') : ''}` : '';
        return `<div class="cf-${it.k} ${it.cls || ''}${it.swap ? ' swp' : ''}${it.tail ? ' t-' + it.tail : ''}" id="${p}${it.id}" style="${box}${gap}">${inner(it, p)}${kids}</div>`;
      };
      const items = d.items.filter(it => !it.row).map(one).join('');
      const SEC = window.CF_SECTIONS, sec = SEC && d.sec ? `<div class="cf-sec" id="${p}sec">${SEC.map((l, i) => `<span class="${i + 1 === d.sec ? 'on' : i + 1 < d.sec ? 'done' : ''}"><i></i>${i + 1 === d.sec ? l : ''}</span>`).join('')}</div>` : '';
      return `${heading(p, d)}${sec}<div class="content"><div class="rel"><div class="cf-world" style="left:0;top:0;width:${W}px;height:${H}px">
        <svg class="cf-edges" viewBox="0 0 ${W} ${H}" style="width:${W}px;height:${H}px"><defs><marker id="${p}ah" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto"><path d="M1 1 11 6 1 11z"/></marker></defs>${edges}</svg>
        ${items}${d.sub ? `<div class="sub cf-sub" id="${p}sub" style="left:0;top:${H + 20}px;width:${W}px">${d.sub}</div>` : ''}</div></div></div>`;
    },
    frame: (t, c) => {
      const p = c.p, d = c.data, B = beats(c), n = d.items.length;
      headIn(B, p);
      if (d.sec) up(p + 'sec', seg(c.local, 0, .35), -12);
      const alias = {};
      d.items.forEach((it, i) => {
        const id = p + it.id, e = el(id); if (!e) return;
        const nm = nameOf(it); alias[nm] = it.id;
        [it.count, it.swap, it.type].concat(it.moves || [], it.on || [], it.states || []).forEach(m => { if (m && m.b && !alias[m.b]) alias[m.b] = it.id; });
        const fa = it.at != null ? it.at : .12 + .62 * i / Math.max(1, n);
        const q = it.pre ? 1 : B.p(nm, fa, fa + .14, it.fx === 'stamp' || it.k === 'stamp' ? 'pop' : 'enter');
        const fx = it.fx || ENTER_FX[it.k] || 'up';
        let o = 1, tx = 0, ty = 0, s = 1, r = it.r || 0;
        if (q < 1) {
          if (fx === 'up') { const k = eo4(q); o = k; ty = (1 - k) * 34; }
          else if (fx === 'pop') { const k = bk(q); o = cl(q * 2.2, 0, 1); s = .82 + .18 * k; }
          else if (fx === 'sx' || fx === 'sxr') { const k = eo4(q); o = k; tx = (1 - k) * (fx === 'sx' ? -90 : 90); }
          else if (fx === 'fd') o = q;
          else if (fx === 'drop') { const k = bk(q); o = cl(q * 2.5, 0, 1); ty = (1 - k) * -60; }
          else if (fx === 'stamp') { const k = eo4(q); o = cl(q * 3, 0, 1); s = 1.9 - .9 * k; r += (1 - k) * -10; }
        }
        // later poses, each from the previous one
        let x = it.x, y = it.y;
        (it.moves || []).forEach((m, j) => {
          const mq = eio(B.p(m.b, cl(fa + .2 + .1 * j, 0, .95), cl(fa + .3 + .1 * j, 0, 1), 'enter', { len: m.d || .6, focal: false }));
          if (m.x != null) x = lerp(x, m.x, mq);
          if (m.y != null) y = lerp(y, m.y, mq);
          if (m.s != null) s *= lerp(1, m.s, mq);
          if (m.r != null) r = lerp(r, m.r, mq);
          if (m.o != null) o *= lerp(1, m.o, mq);
        });
        if (it.out) { const oq = eio(B.p(it.out.b, .9, .98, 'enter', { len: .5, focal: false })); tx += (it.out.dx || 0) * oq; ty += (it.out.dy || 0) * oq; o *= 1 - oq; }
        if (it.dim) o *= 1 - .55 * eo(B.p(it.dim, .9, .95, 'enter', { len: BEAT.dim, focal: false }));
        if (!it.row) { e.style.left = x.toFixed(1) + 'px'; e.style.top = y.toFixed(1) + 'px'; }
        e.style.opacity = o.toFixed(3);
        e.style.transform = `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${s.toFixed(4)}) rotate(${r.toFixed(2)}deg)`;
        (it.on || []).forEach(sw => cls(id, sw.cls, B.p(sw.b, .9, .95, 'pop', { focal: false }) > .5 && !(sw.until && B.p(sw.until, .96, .99, 'pop', { focal: false }) > .5)));
        if (it.swap) cls(id, 'sw', B.p(it.swap.b, .9, .95, 'pop', { focal: false }) > .5);
        if (it.count) tick(id + '-n', B.p(it.count.b, .5, .7, 'tick', { focal: false }), it.count.from, it.count.to,
          it.count.fmt === 'comma' ? v => Math.round(v).toLocaleString('en-US') : v => String(Math.round(v)));
        if (it.states) {
          let cur = null;
          it.states.forEach(sv => { if (B.p(sv.b, .9, .95, 'pop', { focal: false }) > .5) cur = sv; });
          const key = cur ? it.states.indexOf(cur) : -1;
          if (e.dataset.st !== String(key)) {
            const base = it.base || {}, set = Object.assign({}, base, cur ? cur.set : {});
            Object.keys(set).forEach(sel => { const t = e.querySelector(sel); if (t) t.innerHTML = set[sel]; });
            e.dataset.st = key;
          }
        }
        if (it.k === 'sub') {
          const r0 = B.at(nm, fa, fa + .1, 'enter', { focal: false });
          // t0: seconds the bar already ran on the previous slide (a cut carries its click tour across)
          SUB.frame(p, it.done ? 30 : Math.max(0, c.local + (it.t0 || 0) - (it.pre ? 0 : r0.s)), { x: 0, y: 0, k: it.kk || 1, name: it.name || 'LifeTechFacts', handle: it.handle || '@lifetechfacts' });
        }
        if (it.reveal) {
          const rv = B.at(it.reveal.b, fa, fa + .3, 'enter', { focal: false }), kids = e.querySelectorAll(it.reveal.sel || '.rr');
          kids.forEach((k, j) => { const kq = B.on || rv.beat ? seg(c.local, rv.s + j * (it.reveal.step || .3), rv.s + j * (it.reveal.step || .3) + .25) : seg(c.t, rv.fa, rv.fb);
            k.style.opacity = kq.toFixed(3); k.style.transform = `translateY(${((1 - eo(kq)) * -10).toFixed(1)}px)`; });
        }
        if (it.press) {   // a pointer press: the thing dips for 0.22 s on its beat (scripts/sfx clicks it via clicks.json)
          const pr = B.at(it.press.b, .5, .52, 'pop', { focal: false });
          cls(id, 'down', (pr.beat || B.on) && c.local >= pr.s + .1 && c.local < pr.s + .32);
        }
        /* spinners (a loading state) turn with the slide clock: a CSS animation would not be deterministic */
        e.querySelectorAll('.cf-spin').forEach(sp => { sp.style.transform = `rotate(${(c.local * 400 % 360).toFixed(1)}deg)`; });
        if (it.k === 'bar') st(id + '-f', { transform: `scaleY(${(eo(q) * (it.v != null ? it.v : 1)).toFixed(4)})` });
        if (it.type) {
          const r0 = B.at(it.type.b, fa, fa + .3, 'enter', { focal: false });
          const total = it.lines.reduce((a, ln) => a + lineLen(ln), 0);
          const room = Math.max(.5, (c.exit != null ? c.exit : c.screen) - .4 - r0.s);
          const cps = Math.max(it.type.cps || 22, total / room, it.type.dur ? total / it.type.dur : 0);
          const nch = r0.beat || B.on ? Math.floor(cl((c.local - r0.s) * cps, 0, total)) : Math.floor(total * seg(c.t, r0.fa, r0.fb));
          const bd = el(id + '-bd');
          if (bd && bd.dataset.n !== String(nch)) { bd.innerHTML = typed(it.lines, nch, it.k === 'term'); bd.dataset.n = nch; }
        }
      });
      (d.edges || []).forEach((ed, i) => {
        const nm = ed.b || ed.id;
        /* the edge is a bare <path>: draw it on, then (flow) hand the stroke to a moving dash, or (dash) a still one */
        const pe = el(p + ed.id); if (!pe) return;
        const q = B.p(nm, .3 + .5 * i / Math.max(1, d.edges.length), .4 + .5 * i / Math.max(1, d.edges.length), 'draw', { focal: false });
        if (pe.dataset.mk === undefined) { pe.dataset.mk = pe.getAttribute('marker-end') || ''; pe.dataset.len = pe.getTotalLength(); }
        const L = +pe.dataset.len;
        pe.style.opacity = q > 0 ? 1 : 0;
        if (q < 1) { pe.style.strokeDasharray = L + ' ' + L; pe.style.strokeDashoffset = (L * (1 - eo(q))).toFixed(1); }
        else if (ed.flow) { pe.style.strokeDasharray = '14 12'; pe.style.strokeDashoffset = (-c.local * 40 % 26).toFixed(1); }
        else if (ed.dash) { pe.style.strokeDasharray = '12 12'; pe.style.strokeDashoffset = '0'; }
        else { pe.style.strokeDasharray = 'none'; pe.style.strokeDashoffset = '0'; }
        if (pe.dataset.mk) pe.setAttribute('marker-end', q > .93 ? pe.dataset.mk : 'none');
      });
      if (d.sub) up(p + 'sub', B.p('sub', .8, .92));
      footIn(B, p); holdLife(B, p, d, { alias });
    },
  });
})();
