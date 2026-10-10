/* The text layer of a vertical social cut (scripts/social-cut.js), composited over the cut footage by
   `npm run assemble -- --over`. The footage is already the cut's own deck (with the speaker full-bleed in the
   talking-head windows), so this layer only adds the hook: a one-line band pinned to the very top of the frame for the
   first seconds. It sits at the very top, 0-124 (asked for by the user on 2026-10-10, though the apps' top bar covers
   that strip): it shows for 3.2s only, over the opening face shot, and ends above every heading (236). Linked into each social project's slides/ as 990-hook.js, clear of the deck's slide numbers (90 collided with a 150-slide deck).
   Captions come from core/captions.js (captions.json, the cut's own words). Everything it says comes from
   TIMELINE.social, which scripts/social-cut.js writes per cut: { hook, total, labels?, progress? }. Pure in ctx.local
   (seconds). Optional, both off unless cuts.json asks:
     labels [[a, b, text, y]]  a section chip centred at stage y, shown a..b (a screencast cut names each demo section)
     progress                  a 6px teal bar along the top edge that fills 0..total, under the hook band while it shows */
(function () {
  const S = (window.TIMELINE && window.TIMELINE.social) || { hook: 'Hook', total: 5 };
  const OUT = 3.2;   // the card leaves before the first caption group has been read twice

  defineSlide({
    slug: '990-hook', dur: S.total,
    data: S,
    html: (d, c) => {
      const p = c.p, W = c.grid.w;
      return `<style>
  .so-card{position:absolute;left:0;width:${W}px;top:0;height:124px;padding:0 40px;box-sizing:border-box;display:flex;
    align-items:center;justify-content:center;background:var(--bg0);border-bottom:3px solid var(--violet);
    text-align:center;font:800 46px/1.1 ID;letter-spacing:-.015em;color:var(--tx);white-space:nowrap}
  .so-card em{font-style:normal;color:var(--teal)}
  .so-lab{position:absolute;left:0;width:${W}px;display:flex;justify-content:center;opacity:0}
  .so-lab span{padding:12px 26px;border-radius:14px;background:rgba(2,6,23,.86);border:2px solid var(--teal);font:700 36px JB;color:var(--tx);white-space:nowrap}
  .so-lab em{font-style:normal;color:var(--teal)}
  .so-bar{position:absolute;left:0;top:0;width:${W}px;height:6px;background:var(--teal);transform-origin:left center;transform:scaleX(0)}
</style>
${d.progress ? `<div class="so-bar" id="${p}bar"></div>` : ''}
${(d.labels || []).map(([, , text, y], i) => `<div class="so-lab" id="${p}lb${i}" style="top:${y}px"><span>${text}</span></div>`).join('')}
<div class="so-card" id="${p}card"><span>${d.hook}</span></div>`;
    },
    frame: (u, c) => {
      const p = c.p, T = c.local, a = eo(seg(T, 0, .45)) * (1 - seg(T, OUT, OUT + .35));
      document.getElementById(p + 'card').style.cssText += `;opacity:${a.toFixed(3)};transform:translateY(${((1 - eo(seg(T, 0, .45))) * -124).toFixed(1)}px)`;
      const bar = document.getElementById(p + 'bar');
      if (bar) bar.style.transform = `scaleX(${cl(T / (c.data.total || 1), 0, 1).toFixed(4)})`;
      (c.data.labels || []).forEach(([s, e], i) => {
        // in with the panes (they fade over 0.25s), a 12px rise; out just before the window closes
        const k = eo(seg(T, s + .1, s + .45)) * (1 - seg(T, e - .3, e - .05));
        const el = document.getElementById(p + 'lb' + i);
        el.style.opacity = k.toFixed(3); el.style.transform = `translateY(${((1 - k) * 12).toFixed(1)}px)`;
      });
    },
  });
})();
