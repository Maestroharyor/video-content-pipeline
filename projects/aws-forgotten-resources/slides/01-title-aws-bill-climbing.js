defineSlide({
  id: 's01', slug: '01-title-aws-bill-climbing', dur: 5,
  data: {
    eyebrow: 'AWS · cost hygiene', accent: 'o', h1: 'Your AWS bill<br>is climbing',
    foot: 'A quick project. A permanent line item.',
    chart: { title: 'Month-to-date cost', unit: 'USD',
      bars: [{ l: 'Apr', v: 4 }, { l: 'May', v: 9 }, { l: 'Jun', v: 27 }, { l: 'Jul', v: 61 }, { l: 'Aug', v: 128, c: 'a' }, { l: 'Sep', v: 212, c: 'o' }] },
    from: '$0.00', to: '$212.40', sub: 'You launched a server for a quick project. The project ended. The billing did not.'
  },
  html: d => `${heading('s01-', d)}
  <div class="content"><div class="rel">
    <div class="ltile lg sq abs" id="s01-logo" style="left:0;top:0"><img src="${logo('aws-logo-dark')}" alt="AWS" style="background:#fff"></div>
    <div class="badge o" id="s01-bd" style="left:190px;top:34px;font-size:34px"><span id="s01-amt">$0.00</span></div>
    ${costChart({ id: 's01-ch', x: 0, y: 220, w: 960, title: d.chart.title, unit: d.chart.unit, bars: d.chart.bars, plotH: 420, fmt: v => '$' + v })}
    <div class="sub" id="s01-sub" style="left:0;top:880px;width:960px">${d.sub}</div>
  </div></div>`,
  frame: t => {
    up('s01-eb', seg(t, .02, .14)); h1In('s01-h1', seg(t, .06, .22));
    pp('s01-logo', seg(t, .16, .28), .8);
    up('s01-ch', seg(t, .18, .32), 50);
    bars('s01-ch', 6, t, .30, .74, .5);
    const b = seg(t, .40, .52);
    st('s01-bd', { opacity: eo(b), transform: 'translateY(' + ((1 - eo(b)) * 20) + 'px)' });
    tick('s01-amt', seg(t, .44, .78), 0, 212.4, money);
    up('s01-sub', seg(t, .78, .90));
    up('s01-ft', seg(t, .86, .98));
  }
});
