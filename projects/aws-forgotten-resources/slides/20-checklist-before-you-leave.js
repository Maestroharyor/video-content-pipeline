defineSlide({
  id: 's20', slug: '20-checklist-before-you-leave', dur: 5,
  data: {
    eyebrow: 'Before you walk away', accent: 'g', h1: 'Check what is<br>actually running', h1size: 'sm',
    foot: 'Not just what you are using. What is running.',
    items: [{ icon: 'ec2', text: 'EC2 instances', sub: 'stop or terminate', tail: 'EC2 › Instances' },
      { icon: 'ebs', text: 'Attached EBS volumes', sub: 'delete what the instance left behind', tail: 'EC2 › Volumes' },
      { icon: 'rds', text: 'RDS databases', sub: 'snapshot, then delete', tail: 'RDS › Databases' },
      { icon: 'nat-gateway', text: 'NAT gateways', sub: 'delete when the VPC is idle', tail: 'VPC › NAT gateways' }],
    chart: { title: 'Forecast after cleanup', bars: [{ l: 'Jul', v: 61, c: 'd' }, { l: 'Aug', v: 128, c: 'd' }, { l: 'Sep', v: 212, c: 'r' }, { l: 'Oct', v: 4, c: 'g' }], max: 260 }
  },
  html: d => `${heading('s20-', d)}
  <div class="content"><div class="rel">
    ${d.items.map((it, i) => checkRow(Object.assign({ id: 's20-c' + (i + 1), y: i * 128 }, it))).join('')}
    ${costChart({ id: 's20-ch', x: 0, y: 560, w: 960, title: d.chart.title, unit: 'USD / month', bars: d.chart.bars, plotH: 230, max: d.chart.max, fmt: v => '$' + v })}
    <div class="badge g" id="s20-bd" style="left:0;top:960px;font-size:36px;padding:18px 28px">Back to almost zero</div>
  </div></div>`,
  frame: t => {
    up('s20-eb', seg(t, .02, .10)); h1In('s20-h1', seg(t, .04, .16));
    [1, 2, 3, 4].forEach(i => {
      sx('s20-c' + i, seg(t, .08 + (i - 1) * .10, .22 + (i - 1) * .10), -60);
      const ck = seg(t, .24 + (i - 1) * .11, .32 + (i - 1) * .11);
      draw('s20-c' + i + '-ck', ck);
      cls('s20-c' + i, 'done', ck > .2);
    });
    up('s20-ch', seg(t, .62, .72), 40);
    bars('s20-ch', 4, t, .68, .90, .5);
    pp('s20-bd', seg(t, .86, .96), .8);
    up('s20-ft', seg(t, .90, 1));
  }
});
