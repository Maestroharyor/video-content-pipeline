defineSlide({
  id: 's22', slug: '22-outro-follow', dur: 5, audio: 'outro.wav',
  data: {
    eyebrow: 'That\'s the list', accent: 't', h1: 'Follow for more.',
    foot: 'Three AWS resources you forget to turn off. Save this before you close the tab.', footTop: 1480,
    handles: [{ icon: 'instagram', handle: '@maestroharyor', net: 'Instagram' }, { icon: 'x', handle: '@maestroharyor', net: 'X' },
      { text: 'in', color: '#0A66C2', handle: 'ayomide-odewale', net: 'LinkedIn' }, { icon: 'tiktok', handle: '@maestroharyor', net: 'TikTok' }],
    box: { title: 'Everything in one place', url: 'braandly.bio/ayomideodewale' }
  },
  html: d => `${heading('s22-', d)}
  ${d.handles.map((h, i) => `<div class="hrow" id="s22-hr${i + 1}" style="left:60px;top:${470 + i * 162}px"><span class="ht">${h.icon ? `<img src="${logo(h.icon, true)}" alt="${h.net}">` : `<span class="ltxt" style="font-size:52px;color:${h.color}">${h.text}</span>`}</span><span class="hx"><b>${h.handle}</b><i>${h.net}</i></span></div>`).join('')}
  <svg class="draw" id="s22-div" style="left:60px;top:1130px;width:960px;height:12px" viewBox="0 0 960 12"><path d="M0 6 H960" stroke="#2E3D5C" stroke-width="4"/></svg>
  <div class="bbox" id="s22-box" style="left:60px;top:1200px;width:960px">
    <span class="bl"><img src="${logo('braandly', true)}" alt="braandly"></span>
    <span class="bt"><b>${d.box.title}</b><i>${d.box.url}</i></span>
    <span class="shim" id="s22-shim" style="left:-240px"></span>
  </div>`,
  frame: t => {
    up('s22-eb', seg(t, .02, .14)); h1In('s22-h1', seg(t, .05, .22));
    const beats = [.30, .42, .54, .66];
    [1, 2, 3, 4].forEach((i, k) => {
      const p = seg(t, beats[k], beats[k] + .10), e = bk(p);
      st('s22-hr' + i, { opacity: cl(p * 2.4, 0, 1), transform: 'translateX(' + ((1 - eo(p)) * -40) + 'px) scale(' + (.80 + .20 * e) + ')' });
    });
    draw('s22-div', seg(t, .70, .80));
    up('s22-box', seg(t, .78, .90), 40);
    const sp = seg(t, .86, 1);
    st('s22-shim', { opacity: sp > 0 && sp < 1 ? 1 : 0, transform: 'translateX(' + (sp * 1320) + 'px)' });
    up('s22-ft', seg(t, .90, 1));
  }
});
