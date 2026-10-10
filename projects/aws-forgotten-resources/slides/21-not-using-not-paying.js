defineSlide({
  id: 's21', slug: '21-not-using-not-paying', dur: 5,
  data: {
    eyebrow: 'The AWS rule', accent: 'o', h1: '"Not using it"<br>≠ "not paying for it"', h1size: 'xs',
    foot: 'AWS bills for existence, not for use.',
    left: { lb: 'What you think', qt: '"I\'m not using it."' }, right: { lb: 'What AWS hears', qt: '"Keep it running."' },
    icons: [{ icon: 'ec2', label: 'EC2' }, { icon: 'ebs', label: 'EBS' }, { icon: 'rds', label: 'RDS' }, { icon: 'nat-gateway', label: 'NAT' }],
    sub: 'Idle resources are still provisioned resources. Provisioned is what you pay for.'
  },
  html: d => `${heading('s21-', d)}
  <div class="content"><div class="rel">
    <div class="cmp" id="s21-l" style="left:0;top:0;width:960px;height:200px"><span class="lb">${d.left.lb}</span><span class="qt">${d.left.qt}</span></div>
    <div class="badge o" id="s21-neq" style="left:400px;top:224px;font:800 56px ID;padding:6px 30px">≠</div>
    <div class="cmp r" id="s21-r" style="left:0;top:340px;width:960px;height:200px"><span class="lb">${d.right.lb}</span><span class="qt">${d.right.qt}</span></div>
    <svg class="strike" id="s21-st" style="left:30px;top:70px;width:460px;height:60px" viewBox="0 0 460 60"><path d="M0 44 Q230 34 460 22"/></svg>
    ${d.icons.map((ic, i) => logoStack({ id: 's21-i' + (i + 1), x: 80 + i * 220, y: 600, icon: ic.icon, label: ic.label, size: 'sm', w: 160 })).join('')}
    <div class="sub" id="s21-sub" style="left:0;top:820px;width:960px">${d.sub}</div>
  </div></div>`,
  frame: t => {
    up('s21-eb', seg(t, .02, .12)); h1In('s21-h1', seg(t, .04, .20));
    sx('s21-l', seg(t, .14, .30), -70);
    pp('s21-neq', seg(t, .34, .46), .5);
    sx('s21-r', seg(t, .40, .56), 70);
    draw('s21-st', seg(t, .58, .70));
    [1, 2, 3, 4].forEach(i => pp('s21-i' + i, seg(t, .66 + i * .05, .78 + i * .05), .7));
    up('s21-sub', seg(t, .84, .94));
    up('s21-ft', seg(t, .90, 1));
  }
});
