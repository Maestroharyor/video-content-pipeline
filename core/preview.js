/* Preview control bar (only loaded by scripts/preview.js, never by the renderer). Scales the stage to the window,
   scrubs/plays the timeline through window.setTime, keeps the voiceover <audio> in sync, and lists slides. */
(function () {
  // the registry builds the deck on DOMContentLoaded; the bar needs window.LAYOUT
  if (!window.DECK_READY) return document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0));
  init();
})();
function init() {
  const PV = window.PREVIEW || {};
  const css = `
  html,body{background:#05070c;height:100%;overflow:hidden}
  #pv-wrap{position:fixed;left:0;top:0;right:0;bottom:64px;display:grid;place-items:center}
  #stage{transform-origin:center center}
  #pv{position:fixed;left:0;right:0;bottom:0;height:64px;background:#0b1020;border-top:1px solid #23304A;display:flex;align-items:center;gap:12px;padding:0 14px;font:500 13px Inter,system-ui;color:#A8B6D1;z-index:99}
  #pv button{background:#162034;border:1px solid #2E3D5C;color:#F2F6FF;border-radius:8px;padding:6px 12px;font:600 13px Inter;cursor:pointer}
  #pv select{background:#162034;border:1px solid #2E3D5C;color:#F2F6FF;border-radius:8px;padding:6px 8px;font:500 13px Inter;max-width:260px}
  #pv input[type=range]{flex:1 1 auto;accent-color:#2DD4BF}
  #pv .t{font:600 13px JB,monospace;color:#2DD4BF;min-width:150px}
  #pv .u{font:500 12px JB,monospace;color:#6E7F9E;min-width:120px}`;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
  const stage = document.getElementById('stage');
  const wrap = document.createElement('div'); wrap.id = 'pv-wrap'; stage.parentNode.insertBefore(wrap, stage); wrap.appendChild(stage);
  function fit() { const G = window.GRID; const k = Math.min((innerWidth - 24) / G.w, (innerHeight - 64 - 24) / G.h); stage.style.transform = 'scale(' + k + ')'; }
  addEventListener('resize', fit); fit();

  const L = window.LAYOUT, total = L[L.length - 1].end, fps = PV.fps || 30;
  const bar = document.createElement('div'); bar.id = 'pv';
  bar.innerHTML = `<button id="pv-play">▶ play</button><select id="pv-slide">${L.map((e, i) => `<option value="${e.start}">${i + 1}. ${e.slug}</option>`).join('')}</select>
    <input type="range" id="pv-rng" min="0" max="${total}" step="${1 / fps}" value="0"><span class="t" id="pv-t"></span><span class="u" id="pv-u"></span>
    <button id="pv-canvas">${window.GRID.canvas === 'vertical' ? 'horizontal' : 'vertical'}</button>`;
  document.body.appendChild(bar);
  const audio = PV.vo ? Object.assign(document.createElement('audio'), { src: PV.vo, preload: 'auto' }) : null;
  if (audio) document.body.appendChild(audio);
  const $ = id => document.getElementById(id);
  let T = 0, playing = false, t0 = 0, T0 = 0;
  const fmt = s => { const m = Math.floor(s / 60), ss = (s % 60).toFixed(2).padStart(5, '0'); return m + ':' + ss; };
  function show(t) {
    T = Math.max(0, Math.min(total, t));
    const r = window.setTime(T);
    $('pv-rng').value = T; $('pv-t').textContent = fmt(T) + ' / ' + fmt(total);
    $('pv-u').textContent = r.id + ' u=' + r.u.toFixed(2) + (r.out ? ' out=' + r.out.toFixed(2) : '');
    const i = window.TL.slideAt(L, T); $('pv-slide').selectedIndex = i;
  }
  function loop() { if (!playing) return; show(T0 + (performance.now() - t0) / 1000); if (T >= total) return stop(); requestAnimationFrame(loop); }
  function play() { playing = true; t0 = performance.now(); T0 = T >= total ? 0 : T; $('pv-play').textContent = '❚❚ pause'; if (audio) { audio.currentTime = T0; audio.play().catch(() => {}); } loop(); }
  function stop() { playing = false; $('pv-play').textContent = '▶ play'; if (audio) audio.pause(); }
  $('pv-play').onclick = () => playing ? stop() : play();
  $('pv-rng').oninput = e => { if (playing) stop(); show(+e.target.value); };
  $('pv-slide').onchange = e => { if (playing) stop(); show(+e.target.value); };
  $('pv-canvas').onclick = () => { const u = new URL(location.href); u.searchParams.set('canvas', window.GRID.canvas === 'vertical' ? 'horizontal' : 'vertical'); location.href = u; };
  addEventListener('keydown', e => {
    if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') e.target.blur();
    if (e.code === 'Space') { e.preventDefault(); playing ? stop() : play(); }
    else if (e.code === 'ArrowRight') { stop(); show(T + (e.shiftKey ? 1 : 1 / fps)); }
    else if (e.code === 'ArrowLeft') { stop(); show(T - (e.shiftKey ? 1 : 1 / fps)); }
    else if (/^Digit[1-9]$/.test(e.code)) { const i = +e.code.slice(5) - 1; if (L[i]) { stop(); show(L[i].start); } }
  });
  show(0);
}
