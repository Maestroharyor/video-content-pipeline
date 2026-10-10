/* window.LFT: the LifeTech Facts thumbnail kit. A thumbnail is a static custom slide on the 1920x1080 stage, rendered with
   `npm run render -- --project <slug> --slide NN --poster` (4K PNG) and scaled down to 1280x720 for upload.
   Rules the kit is built around (research, Sept 2026): read at 168x94, one focal point, four words or fewer, a large lit face,
   nothing important bottom-right (YouTube's duration badge), text that adds to the title instead of repeating it.
     --var font=koho            KoHo Bold instead of Inter Display Black (or project.js -> thumbs.font)
     LFT.C                      palette (navy ground, brand blue, one loud accent per design: yellow / red / green)
     LFT.css                    shared styles (.th root, .th-h headline, .th-chip, helpers); put it first in html()
     LFT.ground(o)              background: navy + grid + a colour glow behind the face {gx, gy, glow, grid, vig, c0, c1}
     LFT.face(name, o)          cut-out person from the project's assets/faces/<name>.png (made with scripts/cutout.swift)
                                {h, left|right, bottom, flip, outline, outlineColor, glow, grade, extra, style}
     LFT.fx(o) / LFT.src(name)  the same treatment as a filter string / the cutout's URL, for slides that build the face from pieces
     LFT.badge(o)               the LF mark, small, top-left by default {x, y, d}
     LFT.youtube(h)             a play-button icon h pixels tall (own drawing: red rounded plate, white triangle)
     LFT.h(lines, o)            headline block; lines = [[text, colour?], ...] {x, y, size, align, rotate}                                   */
(function () {
  const C = { bg0: '#050814', bg1: '#0B1430', blue: '#3B5998', sky: '#5B8CFF', ink: '#FFFFFF', dim: '#9FB0D6', yellow: '#FFD23F', red: '#FF4B3E', green: '#3DDC84' };
  /* headline font: Inter Display Black by default; --var font=koho switches to KoHo Bold (its heaviest cut, fattened with a same-colour stroke; loaded here so document.fonts.ready waits for it) */
  const KOHO = ((window.VARS && window.VARS.font) || (window.PROJECT.thumbs || {}).font) === 'koho';
  if (KOHO) ['SemiBold:600', 'Bold:700 900'].forEach(w => { const f = new FontFace('KoHo', `url(${(window.ASSETS || '../../assets/')}fonts/KoHo-${w.split(':')[0]}.ttf)`, { weight: w.split(':')[1] }); document.fonts.add(f); f.load(); });
  const css = `<style>
.th{position:absolute;inset:0;overflow:hidden;background:${C.bg0};font-family:${KOHO ? 'KoHo,' : ''}ID,Inter,sans-serif;color:#fff}
.th *{box-sizing:border-box}
.th-glow{position:absolute;border-radius:50%;filter:blur(70px)}
.th-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(126,155,224,.08) 2px,transparent 2px),linear-gradient(90deg,rgba(126,155,224,.08) 2px,transparent 2px);background-size:96px 96px}
.th-vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,transparent 50%,rgba(0,0,0,.62) 100%)}
.th-h{position:absolute;margin:0;font-weight:900;text-transform:uppercase;letter-spacing:${KOHO ? '-.01em' : '-.03em'};line-height:${KOHO ? '.9' : '.88'};white-space:nowrap;${KOHO ? '-webkit-text-stroke:.034em currentColor;' : '-webkit-text-stroke:.05em rgba(3,6,16,.92);paint-order:stroke fill;'}text-shadow:0 .04em 0 rgba(0,0,0,.5),0 0 .3em rgba(0,0,0,.55)}
.th-h span{display:block}
.th-face{position:absolute;display:block}
.th-chip{position:absolute;display:inline-block;font-weight:800;text-transform:uppercase;letter-spacing:.04em;border-radius:14px;padding:.32em .6em .3em;line-height:1;white-space:nowrap}
.th-badge{position:absolute;display:block;filter:drop-shadow(0 6px 18px rgba(0,0,0,.5))}
</style>`;
  const ring = (w, col) => w ? [[w, 0], [-w, 0], [0, w], [0, -w], [w * .7, w * .7], [-w * .7, w * .7], [w * .7, -w * .7], [-w * .7, -w * .7]].map(v => `drop-shadow(${v[0].toFixed(1)}px ${v[1].toFixed(1)}px 0 ${col})`).join(' ') : '';
  window.LFT = {
    C, css,
    ground: o => { o = Object.assign({ gx: 1380, gy: 520, glow: 'rgba(72,120,255,.55)', size: 1100, grid: 1, vig: 1, c0: C.bg0, c1: C.bg1 }, o);
      return `<div style="position:absolute;inset:0;background:linear-gradient(135deg,${o.c1},${o.c0} 70%)"></div>${o.grid ? '<div class="th-grid"></div>' : ''}
<div class="th-glow" style="left:${o.gx - o.size / 2}px;top:${o.gy - o.size / 2}px;width:${o.size}px;height:${o.size}px;background:radial-gradient(circle,${o.glow},transparent 68%)"></div>${o.vig ? '<div class="th-vig"></div>' : ''}`; },
    face: (name, o) => { o = Object.assign({}, LFT.FACE, o);
      const pos = (o.left != null ? `left:${o.left}px;` : `right:${o.right || 0}px;`) + `bottom:${o.bottom}px;`;
      return `<img class="th-face" src="${LFT.src(name)}" style="${pos}height:${o.h}px;${o.flip ? 'transform:scaleX(-1);' : ''}filter:${LFT.fx(o)};${o.style || ''}">`; },
    src: name => (window.PASSETS || 'assets/') + 'faces/' + name + '.png',
    /* the face treatment as a CSS filter: grade, sticker outline, colour glow (also usable on a wrapper around several pieces) */
    fx: o => `${o.grade} ${ring(o.outline, o.outlineColor)}${o.glow ? ` drop-shadow(0 0 46px ${o.glow})` : ''}${o.extra ? ' ' + o.extra : ''}`,
    FACE: { h: 1040, bottom: -20, outline: 7, outlineColor: '#fff', glow: 'rgba(91,140,255,.75)', grade: 'contrast(1.1) saturate(1.2) brightness(1.2)' },
    badge: o => { o = Object.assign({ x: 56, y: 48, d: 120 }, o);
      return `<img class="th-badge" src="${(window.ASSETS || '../../assets/') + 'logos/lifetechfacts/lf-mark.svg'}" style="left:${o.x}px;top:${o.y}px;width:${o.d}px;height:${o.d}px">`; },
    youtube: h => `<svg width="${(h * 1.42).toFixed(0)}" height="${h}" viewBox="0 0 142 100" style="flex:none;filter:drop-shadow(0 6px 0 rgba(0,0,0,.45))"><rect width="142" height="100" rx="28" fill="#FF0000"/><path d="M56 28L98 50L56 72Z" fill="#fff"/></svg>`,
    h: (lines, o) => { o = Object.assign({ x: 80, y: 300, size: 260, align: 'left', rotate: 0 }, o);
      return `<h1 class="th-h" style="${o.align === 'right' ? `right:${o.x}px;text-align:right` : `left:${o.x}px`};top:${o.y}px;font-size:${o.size}px;${o.rotate ? `transform:rotate(${o.rotate}deg);transform-origin:${o.align === 'right' ? '100%' : '0'} 50%;` : ''}${o.style || ''}">${lines.map(l => `<span style="color:${l[1] || C.ink}${l[2] ? ';' + l[2] : ''}">${l[0]}</span>`).join('')}</h1>`; },
  };
})();
