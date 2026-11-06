/* The last 4 seconds of every social cut (scripts/social-cut.js; linked into each social project's slides/ as
   991-endcard.js): "watch the full video on YouTube", with the published video's own
   thumbnail (assets/yt-thumb.jpg, fetched from the video page) and title, so a viewer can recognise it in search.
   Opaque: the cut's footage stops under it. The channel's end-screen sting (assets/end-sting.wav) is the slide's
   audio bed, so assemble mixes it in at the card's first frame. The shortlink sits last, where the eye ends up, for
   the networks that do not make a caption link clickable.
   Data from TIMELINE.social, written per cut by scripts/social-cut.js: { ytTitle, ytUrl, next? }. next (a parts series,
   cuts.json cut.next): a "Next: Part 3 · …" chip at the top, so a viewer knows there is more. Pure in ctx.local (seconds). */
(function () {
  const S = (window.TIMELINE && window.TIMELINE.social) || { ytTitle: 'The full video', ytUrl: 'youtube.com/@lifetechfacts' };

  defineSlide({
    slug: '991-endcard', dur: 4, audio: 'end-sting.wav',
    data: S,
    html: (d, c) => {
      // the thumbnail (and the title under it) is centred on the frame like the heading and the link above and below it,
      // and as wide as that centring allows inside the safe column (at most 960): with the phone safe zone (x 60-940,
      // GRID.mobile) that is 800 at x 140, clear of the like/share column
      const p = c.p, W = c.grid.w, sf = c.grid.mobile || c.grid.safe || { l: 0, r: W };
      const TW = Math.min(960, 2 * Math.floor(Math.min(W / 2 - sf.l, sf.r - W / 2))), TH = Math.round(TW * 9 / 16), TX = Math.round((W - TW) / 2), TY = 620;
      return `<style>
  .ec-plate{position:absolute;inset:0;background:
      radial-gradient(70% 34% at 50% 0%,color-mix(in srgb,var(--teal) 14%,transparent),transparent 70%),
      radial-gradient(60% 30% at 50% 100%,color-mix(in srgb,var(--violet) 16%,transparent),transparent 72%),var(--bg0)}
  .ec-eb{position:absolute;left:0;width:${W}px;top:330px;text-align:center;font:700 30px JB;letter-spacing:.24em;text-transform:uppercase;color:var(--teal)}
  .ec-h{position:absolute;left:0;width:${W}px;top:384px;display:flex;align-items:center;justify-content:center;gap:26px;font:800 88px ID;letter-spacing:-.02em;color:var(--tx)}
  .ec-h img{height:84px}
  .ec-th{position:absolute;left:${TX}px;top:${TY}px;width:${TW}px;height:${TH}px;border-radius:28px;overflow:hidden;
    border:2px solid var(--bd2);box-shadow:0 30px 80px rgba(0,0,0,.55)}
  .ec-th>img{width:100%;height:100%;object-fit:cover;display:block}
  .ec-bar{position:absolute;left:0;bottom:0;height:10px;background:#FF0033}
  .ec-play{position:absolute;left:50%;top:50%;width:150px;height:104px;margin:-52px 0 0 -75px;border-radius:30px;background:#FF0033;
    display:flex;align-items:center;justify-content:center;box-shadow:0 12px 40px rgba(0,0,0,.45)}
  .ec-play:after{content:'';border-left:44px solid #fff;border-top:26px solid transparent;border-bottom:26px solid transparent;margin-left:10px}
  .ec-t{position:absolute;left:${TX}px;width:${TW}px;top:${TY + TH + 44}px;font:700 46px/1.2 ID;color:var(--tx)}
  .ec-ch{position:absolute;left:${TX}px;width:${TW}px;top:${TY + TH + 186}px;font:600 34px Inter;color:var(--tx2)}
  .ec-url{position:absolute;left:0;width:${W}px;top:${TY + TH + 290}px;display:flex;justify-content:center}
  .ec-url span{display:inline-flex;align-items:center;gap:18px;padding:22px 38px;border-radius:999px;background:var(--bg1);
    border:2px solid color-mix(in srgb,#FF0033 70%,transparent);font:700 44px JB,monospace;color:var(--tx);letter-spacing:-.01em}
  .ec-url i{width:0;height:0;border-left:22px solid #FF0033;border-top:13px solid transparent;border-bottom:13px solid transparent}
  .ec-nx{position:absolute;left:0;width:${W}px;top:236px;display:flex;justify-content:center}
  .ec-nx span{padding:12px 26px;border-radius:999px;background:color-mix(in srgb,var(--teal) 16%,var(--bg1));border:2px solid var(--teal);font:700 32px ID;color:var(--tx);white-space:nowrap}
  .ec-nx b{color:var(--teal)}
</style>
<div class="ec-plate"></div>
<div class="ec-eb" id="${p}eb">Watch the full video</div>
<div class="ec-h" id="${p}h">on <img src="${logo('youtube', true)}" alt="YouTube"> YouTube</div>
<div class="ec-th" id="${p}th"><img src="${passet('yt-thumb.jpg')}" alt=""><div class="ec-bar" id="${p}bar"></div><div class="ec-play" id="${p}pl"></div></div>
<div class="ec-t" id="${p}t">${d.ytTitle}</div>
<div class="ec-ch" id="${p}ch">LifeTech Facts · @lifetechfacts</div>
<div class="ec-url" id="${p}url"><span><i></i>${d.ytUrl}</span></div>${d.next ? `<div class="ec-nx" id="${p}nx"><span><b>Next:</b> ${d.next}</span></div>` : ''}`;
    },
    frame: (u, c) => {
      const p = c.p, T = c.local, e = id => document.getElementById(p + id);
      const rise = (id, a, b, dy) => { const q = eo(seg(T, a, b)); e(id).style.cssText += `;opacity:${q.toFixed(3)};transform:translateY(${((1 - q) * dy).toFixed(1)}px)`; };
      rise('eb', 0, .35, 20); rise('h', .08, .45, 24);
      const th = eo(seg(T, .18, .62));
      e('th').style.cssText += `;opacity:${th.toFixed(3)};transform:translateY(${((1 - th) * 40).toFixed(1)}px) scale(${(.94 + .06 * th).toFixed(4)})`;
      // the play button pops in, then breathes through the hold; the red progress bar runs as if the video is playing
      const pop = bk(seg(T, .55, .85)), br = 1 + .05 * Math.sin(Math.max(0, T - .85) * 4.2);
      e('pl').style.cssText += `;opacity:${seg(T, .55, .7).toFixed(3)};transform:scale(${(pop * br).toFixed(4)})`;
      e('bar').style.width = (100 * seg(T, .6, 4)).toFixed(2) + '%';
      rise('t', .5, .85, 20); rise('ch', .62, .95, 16); rise('url', .78, 1.15, 18);
      if (e('nx')) rise('nx', .95, 1.3, -16);
    },
  });
})();
