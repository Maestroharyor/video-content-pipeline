/* Starter: the hook alone, centred, over the ground. Replace with the approved directions (one slide per direction,
   NN-name.js). --var v=1|2 picks the hook · --var face=<cutout>|off */
(function () {
  const C = TK.C;
  const H = { 1: [['Your '], ['hook', C.accent]], 2: [['Second '], ['hook', C.accent]] }[+(window.VARS || {}).v || 1];
  const wide = () => TK.title([H], { align: 'center', y: 420, size: 170 }) + TK.mark();
  const tall = () => TK.title([H], { x: 100, y: 420, size: 150 }) + TK.cut() + TK.mark();
  defineSlide({ slug: '01-hook', dur: 1, data: {}, html: () => `${TK.css}<div class="pt">${TK.ground({ gx: TK.face() ? 560 : 960 })}${TK.face() ? tall() : wide()}</div>`, frame: () => {} });
})();
