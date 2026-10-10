/* Burned-in captions, pure in T. The renderer injects window.CAPTIONS = {style:{accent,y,size}, groups:[{start,end,words:[{w,s,e}]}]}
   (built from vo.json by `npm run captions`). Without it nothing is added to the stage. */
(function () {
  const C = window.CAPTIONS;
  if (!C || !C.groups || !C.groups.length) return;
  const G = window.GRID || {};
  const st = Object.assign({ accent: 't', fade: .12 }, C.style || {});
  const stage = document.getElementById('stage');
  const box = document.createElement('div');
  box.className = 'caps ' + (st.accent || 't'); box.id = 'caps';
  if (st.y != null) box.style.top = st.y + 'px';
  if (st.size) box.style.fontSize = st.size + 'px';
  stage.appendChild(box);
  /* PROJECT.captions.yAt = [{from?, to?, y}]: the band's top per stretch of time, for footage whose look changes
     (a talking head that turns into a split with a screen recording). Read live, so a project can pick the list by
     window.VARS; the first entry whose [from, to) holds T wins, otherwise st.y / the grid's capsY stays.
     {from, hide: true} drops the captions there, e.g. under an end card that already says the line. */
  const P = window.PROJECT && window.PROJECT.captions, yAt = P && Array.isArray(P.yAt) ? P.yAt : null;
  const entry = T => yAt.find(e => (e.from == null || T >= e.from) && (e.to == null || T < e.to));
  const yFor = T => { const r = entry(T); return r ? r.y : null; };
  const groups = C.groups;
  function find(T) {
    let lo = 0, hi = groups.length - 1;
    while (lo <= hi) { const m = (lo + hi) >> 1; if (groups[m].end <= T) lo = m + 1; else if (groups[m].start > T) hi = m - 1; else return m; }
    return -1;
  }
  window.capsFrame = function (T) {
    const i = find(T);
    if (i < 0) { box.style.opacity = '0'; return; }
    const g = groups[i];
    // by T, not by the group's start: a group that straddles a change of look moves with the footage's cut
    if (yAt && (entry(T) || {}).hide) { box.style.opacity = '0'; return; }
    if (yAt) { const y = yFor(T); const f = y != null ? y : st.y; box.style.top = f != null ? f + 'px' : ''; }
    if (box.dataset.g !== String(i)) {
      box.dataset.g = String(i);
      box.innerHTML = g.words.map(w => `<span>${w.w}</span>`).join(' ');
    }
    const spans = box.children; let cur = -1;
    for (let k = 0; k < g.words.length; k++) if (g.words[k].s <= T + 0.02) cur = k;
    for (let k = 0; k < spans.length; k++) spans[k].classList.toggle('now', k === cur);
    const a = Math.min(1, (T - g.start) / st.fade), b = Math.min(1, (g.end - T) / st.fade);
    box.style.opacity = Math.max(0, Math.min(a, b)).toFixed(3);
  };
  window.capsFrame(0);
})();
