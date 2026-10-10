/* Ambient background. Rebuilds .bgfx as compositor-friendly layers and exposes window.bgFrame(T):
   a slow, deterministic drift (incommensurate sine periods, so nothing visibly loops inside a video).
   PROJECT.bg = { drift: 1, a: 'rgba(255,153,0,.08)', b: 'rgba(139,92,246,.12)' }  (drift 0 = static) */
(function () {
  const P = (window.PROJECT && window.PROJECT.bg) || {};
  const drift = P.drift != null ? P.drift : 1;
  const stage = document.getElementById('stage');
  let fx = stage.querySelector('.bgfx');
  if (!fx) { fx = document.createElement('div'); fx.className = 'bgfx'; stage.insertBefore(fx, stage.firstChild); }
  fx.innerHTML = '<div class="grid"></div><div class="glow a"></div><div class="glow b"></div><div class="vig"></div>';
  const grid = fx.children[0], ga = fx.children[1], gb = fx.children[2];
  if (P.a) ga.style.background = `radial-gradient(60% 46% at 50% 30%, ${P.a}, transparent 70%)`;
  if (P.b) gb.style.background = `radial-gradient(70% 50% at 50% 100%, ${P.b}, transparent 70%)`;
  const f2 = x => x.toFixed(2);
  window.bgFrame = function (T) {
    const w = 2 * Math.PI * (T || 0);
    const gx = -((1.2 * T) % 90) * drift, gy = -((0.8 * T) % 90) * drift;
    grid.style.transform = `translate(${f2(gx)}px,${f2(gy)}px)`;
    ga.style.transform = `translate(${f2(28 * Math.cos(w / 47) * drift)}px,${f2(18 * Math.sin(w / 67) * drift)}px) scale(${f2(1 + .03 * Math.sin(w / 53) * drift)})`;
    gb.style.transform = `translate(${f2(-24 * Math.sin(w / 61) * drift)}px,${f2(22 * Math.cos(w / 43) * drift)}px) scale(${f2(1 + .03 * Math.cos(w / 59) * drift)})`;
  };
  window.bgFrame(0);
})();
