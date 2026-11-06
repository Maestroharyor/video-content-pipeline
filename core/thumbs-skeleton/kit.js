/* window.TK: the pieces every thumbnail here is built from. The shared core of the -thumbs kits (worst-week PT,
   ai-can-clone-apps CT), copied in by npm run thumb-new: grow it per video (the video's own props go here, see
   projects/ai-can-clone-apps-thumbs/kit.js for a full example). Each piece returns HTML in stage px (1920x1080) and is a
   pure function of its options. The probe's contract: .pt-title is the hook (>= 120 px), every other word >= 44 px,
   .pt-ground / .pt-mark / .pt-face are exempt from the safe box.
     TK.C, TK.css               palette (set it from the video's theme CSS), shared styles
     TK.ground(o)               key light {gx, gy}, back wall, floor from {floor}, pools of light {spots: [[x, w], ..]}
     TK.title(lines, o)         the hook: lines = [[[text, colour?], ..], ..] {x, y, size, align, lh}
     TK.tile(src, o)            a real logo or app icon on a lit tile {x, y, d, frame}
     TK.label(text, o)          a short side name centred on cx {cx, y, size}
     TK.face(), TK.cut(o)       the --var face cutout with a white sticker edge {right, h, glow}
     TK.mark(o)                 the LF channel mark */
(function () {
  const A = window.ASSETS || '../../assets/';
  ['SemiBold:600', 'Bold:700 900'].forEach(w => { const f = new FontFace('KoHo', `url(${A}fonts/KoHo-${w.split(':')[0]}.ttf)`, { weight: w.split(':')[1] }); document.fonts.add(f); f.load(); });
  /* replace with the video's theme (its looks.css / theme CSS); never the plum radial default */
  const C = { base: '#121212', wall: '#1A1A1A', floor0: '#262626', floor1: '#1C1C1C', key: '255,214,150', ink: '#F5F1E8', mute: '#C9C2B4', accent: '#FFB547', tx: '#FFFFFF' };
  const pass = f => (window.PASSETS || 'assets/') + f;
  const V = () => window.VARS || {};
  document.body.insertAdjacentHTML('beforeend', `<svg width="0" height="0" style="position:absolute"><filter id="pt-line" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
<feMorphology in="SourceAlpha" operator="dilate" radius="9" result="d"/><feFlood flood-color="#fff"/><feComposite in2="d" operator="in" result="w"/>
<feMerge><feMergeNode in="w"/><feMergeNode in="SourceGraphic"/></feMerge></filter></svg>`);
  const css = `<style>
.pt{position:absolute;inset:0;overflow:hidden;background:${C.base}}
.pt-title{position:absolute;margin:0;font-family:KoHo,Inter,sans-serif;font-weight:700;line-height:.94;white-space:nowrap;text-transform:uppercase;
  letter-spacing:-.005em;-webkit-text-stroke:.03em currentColor;text-shadow:0 .045em 0 rgba(0,0,0,.65),0 0 .32em rgba(0,0,0,.7)}
.tk-tile{position:absolute;display:grid;place-items:center;border-radius:24%;box-shadow:0 30px 56px rgba(0,0,0,.65),0 0 120px rgba(${C.key},.22)}
.tk-tile.frame{background:#1E1E1E;border:3px solid #3A3A3A;border-radius:28px}
.tk-tile img{width:100%;height:100%;object-fit:contain}
.tk-tile.frame img{width:88%;height:88%}
.tk-label{position:absolute;transform:translateX(-50%);font:700 1em/1 KoHo,Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:${C.mute};white-space:nowrap;text-shadow:0 4px 10px rgba(0,0,0,.8)}
</style>`;

  const ground = o => { o = Object.assign({ gx: 960, gy: 280, floor: 760, spots: [] }, o); const flat = V().fade === 'off';
    return `<div class="pt-ground" style="position:absolute;inset:0;background:linear-gradient(180deg,${C.wall} 0,${C.base} ${o.floor}px,${C.floor0} ${o.floor}px,${C.floor1} 1080px)"></div>
${flat ? '' : `<div class="pt-ground" style="position:absolute;inset:0;background:radial-gradient(1100px 800px at ${o.gx}px ${o.gy}px,rgba(${C.key},.26),rgba(${C.key},.06) 55%,transparent 75%)"></div>`}
${flat ? '' : o.spots.map(([x, w]) => `<div class="pt-ground" style="position:absolute;left:${x - w / 2}px;top:${o.floor - w * .16}px;width:${w}px;height:${w * .4}px;border-radius:50%;background:radial-gradient(closest-side,rgba(${C.key},.38),rgba(${C.key},.1) 60%,transparent)"></div>`).join('')}
${flat ? '' : '<div class="pt-ground" style="position:absolute;inset:0;background:radial-gradient(120% 105% at 50% 45%,transparent 55%,rgba(0,0,0,.6))"></div>'}`; };

  const title = (lines, o) => { o = Object.assign({ x: 70, y: 140, size: 150, align: 'left' }, o);
    const pos = o.align === 'center' ? 'left:0;right:0;text-align:center' : `left:${o.x}px;text-align:left`;
    return `<h1 class="pt-title" style="${pos};top:${o.y}px;font-size:${o.size}px${o.lh ? ';line-height:' + o.lh : ''}">${lines.map(l => `<div>${l.map(p => `<span style="color:${p[1] || C.tx}">${p[0]}</span>`).join('')}</div>`).join('')}</h1>`; };

  const tile = (src, o) => { o = Object.assign({ d: 240, frame: false }, o);
    return `<div class="tk-tile${o.frame ? ' frame' : ''}" style="left:${o.x}px;top:${o.y}px;width:${o.d}px;height:${o.d}px"><img src="${pass(src)}" alt=""></div>`; };
  const label = (text, o) => { o = Object.assign({ size: 56 }, o);
    return `<div class="tk-label" style="left:${o.cx}px;top:${o.y}px;font-size:${o.size}px">${text}</div>`; };

  const face = () => { const f = V().face; return f && f !== 'off' ? f : null; };
  const cut = o => { o = Object.assign({ right: -150, h: 980, glow: C.accent }, o); const f = face(); if (!f) return '';
    return `${V().fade === 'off' ? '' : `<div style="position:absolute;right:0;bottom:0;width:980px;height:1080px;background:radial-gradient(48% 48% at 62% 50%,${o.glow}40,transparent 72%)"></div>`}
<img class="pt-face" src="${pass('faces/' + f + '.png')}" alt="" style="position:absolute;right:${o.right}px;bottom:-40px;height:${o.h}px;filter:${V().outline === 'off' ? '' : 'url(#pt-line) '}drop-shadow(0 26px 44px rgba(0,0,0,.65))">`; };
  const mark = o => { o = Object.assign({ x: 110, y: 870, d: 90 }, o);
    return `<img class="pt-mark" src="${A}logos/lifetechfacts/lf-mark.svg" alt="" style="position:absolute;left:${o.x}px;top:${o.y}px;width:${o.d}px;height:${o.d}px;opacity:.95">`; };

  window.TK = { C, css, pass, ground, title, tile, label, face, cut, mark };
})();
