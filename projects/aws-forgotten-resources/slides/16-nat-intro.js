defineSlide({
  id: 's16', slug: '16-nat-intro', dur: 5,
  data: {
    eyebrow: '03 · NAT gateway', accent: 'v', h1: 'The one that<br>surprises you',
    foot: 'Created during VPC setup. Forgotten the same afternoon.',
    sub: 'It is a networking component, so it never shows up next to your servers or your databases.'
  },
  html: d => `${heading('s16-', d)}
  <div class="content"><div class="rel">
    <div class="node col v" id="s16-n" style="left:0;top:0;width:960px;height:420px;padding:0">
      <div class="ltile xl"><img src="${logo('nat-gateway')}" alt="NAT gateway" style="width:150px;height:150px"></div>
      <span class="nt"><b style="font:800 52px ID;letter-spacing:-.02em">NAT gateway</b><i style="font-size:30px;color:#CDB9FF">Amazon VPC · Networking</i></span>
    </div>
    ${logoStack({ id: 's16-vpc', x: 370, y: 470, icon: 'vpc', label: 'Lives inside your VPC', size: 'sm', w: 220 })}
    <div class="badge r" id="s16-bd" style="left:0;top:660px;font:600 32px Inter;padding:18px 26px">Surprise networking charge</div>
    <div class="sub" id="s16-sub" style="left:0;top:770px;width:960px">${d.sub}</div>
  </div></div>`,
  frame: t => {
    up('s16-eb', seg(t, .02, .14)); h1In('s16-h1', seg(t, .05, .24));
    pp('s16-n', seg(t, .12, .30), .86);
    pp('s16-vpc', seg(t, .34, .48), .8);
    pp('s16-bd', seg(t, .52, .64), .84);
    up('s16-sub', seg(t, .68, .82));
    up('s16-ft', seg(t, .86, .98));
  }
});
