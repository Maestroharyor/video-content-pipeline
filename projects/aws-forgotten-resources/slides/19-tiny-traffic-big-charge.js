defineSlide({
  id: 's19', slug: '19-tiny-traffic-big-charge', dur: 5,
  data: {
    eyebrow: 'The surprise', accent: 'r', h1: 'Tiny traffic,<br>networking charge', h1size: 'sm',
    foot: 'The line hides under EC2-Other, which is why nobody finds it.',
    traffic: { title: 'Requests / day', bars: [{ l: 'Mon', v: 3 }, { l: 'Tue', v: 1 }, { l: 'Wed', v: 0.5 }, { l: 'Thu', v: 2 }, { l: 'Fri', v: 1 }, { l: 'Sat', v: 0.4 }, { l: 'Sun', v: 0.6 }] },
    bill: [{ l: 'EC2 – Other', v: '$33.10', c: 'v', w: 1 }, { l: 'EC2 – Compute', v: '$0.00', c: 'o', w: 0 }, { l: 'RDS', v: '$0.00', c: 'p', w: 0 }, { l: 'S3', v: '$0.12', c: 'g', w: 0.01 }],
    total: ['Month-to-date', '$33.22'], note: 'NAT gateway hours + data processing'
  },
  html: d => `${heading('s19-', d)}
  <div class="content"><div class="rel">
    ${costChart({ id: 's19-tr', x: 0, y: 0, w: 960, title: d.traffic.title, unit: 'almost nothing', bars: d.traffic.bars, plotH: 200, max: 10, fmt: v => v < 1 ? '' : String(v) })}
    <div class="aws" id="s19-bill" style="left:0;top:380px;height:360px;border-radius:22px">
      <div class="aws-crumb" style="height:52px;font-weight:700;color:var(--aws-ink)">Billing and Cost Management<i>›</i><b>Cost by service</b></div>
      <div class="aws-body" style="padding:10px 18px"><div class="aws-cont">${awsBilling('s19-b', d.bill, d.total)}</div></div>
    </div>
    <div class="badge r" id="s19-q" style="left:0;top:790px;font:700 40px ID;padding:14px 26px">?</div>
    <div class="badge v" id="s19-note" style="left:120px;top:790px;font:600 30px Inter;padding:20px 26px">${d.note}</div>
    <div class="sub" id="s19-sub" style="left:0;top:900px;width:960px">Almost no application traffic, and still a networking charge on the bill.</div>
  </div></div>`,
  frame: t => {
    up('s19-eb', seg(t, .02, .14)); h1In('s19-h1', seg(t, .05, .22));
    up('s19-tr', seg(t, .08, .22), 40);
    bars('s19-tr', 7, t, .18, .44, .4);
    up('s19-bill', seg(t, .40, .54), 50);
    [1, 2, 3, 4].forEach(i => { sx('s19-b-r' + i, seg(t, .46 + i * .05, .58 + i * .05), -30); fill('s19-b-f' + i, seg(t, .54 + i * .05, .72 + i * .05)); });
    up('s19-b-tot', seg(t, .74, .84));
    const g = pulse(seg(t, .72, .90));
    st('s19-b-r1', { background: 'rgba(140,79,255,' + (g * .12) + ')', borderRadius: '8px' });
    pp('s19-q', seg(t, .78, .88), .6);
    sx('s19-note', seg(t, .82, .92), -30);
    up('s19-sub', seg(t, .86, .96));
    up('s19-ft', seg(t, .90, 1));
  }
});
